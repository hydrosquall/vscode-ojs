import type { CellFunc, compileFunc, ohq } from "@hpcc-js/observablehq-compiler";
import { compile } from "@hpcc-js/observablehq-compiler";
import { Runtime } from "@observablehq/runtime";
import { Inspector } from "@observablehq/inspector";
import { Library } from "@observablehq/stdlib";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";

// import "../../../src/notebook/renderers/renderer.css";

class NullObserver implements ohq.Inspector {
    pending() {
    }
    fulfilled(value: any) {
    }
    rejected(error: any) {
    }
}
const nullObserver = new NullObserver();

interface Renderer {
    runtime: ohq.Runtime;
    define: compileFunc;
    main: ohq.Module;
}

interface Cell {
    cellFunc: CellFunc;
    text: string;
    element?: HTMLElement;
}

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Renderer } = {};
    const cells: { [id: string]: Cell } = {};

    context.onDidReceiveMessage!(e => {
        switch (e.command) {
            case "renderOutputItem":
                e.outputs.forEach(([id, data, oldId]) => {
                    if (oldId && oldId !== id) {
                        disposeCell(oldId);
                    }
                    render(id, data);
                });
                break;
            case "disposeOutputItem":
                disposeCell(e.id);
        }
    });

    // , (name?: string): ohq.Inspector => {
    //     if (element) {
    //         const div = document.createElement("div");
    //         element.appendChild(div);
    //         return new Inspector(div);
    //     }
    //     return nullObserver;
    // }) as ohq.Module;

    async function render(id: any, data: OJSOutput, element?: HTMLElement) {

        if (!notebooks[data.uri]) {
            const library = new Library();
            const runtime = new Runtime(library) as ohq.Runtime;
            const define = await compile({ files: data.notebook.files, nodes: [] } as unknown as ohq.Notebook);
            const main = define(runtime);

            notebooks[data.uri] = {
                runtime,
                define,
                main
            };
        }
        if (cells[id] && ((!cells[id].element && element) || cells[id].text !== data.ojsSource)) {
            disposeCell(id);
        }
        if (!cells[id]) {
            const cellFunc: CellFunc = await notebooks[data.uri].define.appendCell({
                id,
                mode: "js",
                value: data.ojsSource
            }, data.folder);
            cellFunc(notebooks[data.uri].runtime, notebooks[data.uri].main, (name?: string): ohq.Inspector => {
                if (element) {
                    const div = document.createElement("div");
                    element.appendChild(div);
                    return new Inspector(div);
                }
                return nullObserver;
            });
            cells[id] = {
                cellFunc,
                text: data.ojsSource,
                element
            };
        }
    }

    async function disposeCell(id: string) {
        if (cells[id]) {
            cells[id].cellFunc.dispose();
            delete cells[id];
        }
    }

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            render(outputItem.id, data, element);
        },

        async disposeOutputItem(id?: string) {
            if (id) {
                await disposeCell(id);
            } else {
                await Promise.all(Object.keys(cells).map(disposeCell));
            }
        }
    };
};

