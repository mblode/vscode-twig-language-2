const vscode = require('vscode');
const prettydiff = require('prettydiff2');

const snippetsArr = require('./hover/filters.json');
const functionsArr = require('./hover/functions.json');
const twigArr = require('./hover/twig.json');

const vscodeConfig = vscode.workspace.getConfiguration('twig-language-2');

function createHover(snippet, type) {
    const example =
        typeof snippet.example == 'undefined' ? '' : snippet.example;
    const description =
        typeof snippet.description == 'undefined' ? '' : snippet.description;
    return new vscode.Hover({
        language: type,
        value: description + '\n\n' + example
    });
}

const prettyDiff = (document, range, options) => {
    const result = [];
    const content = document.getText(range);

    const newText = prettydiff({
        source: content,
        lang: 'twig',
        mode: 'beautify',
        insize: vscodeConfig.tabSize,
        newline: vscodeConfig.newLine,
        objsort: vscodeConfig.methodChain,
        wrap: vscodeConfig.wrap,
        methodchain: vscodeConfig.methodchain,
        ternaryline: vscodeConfig.ternaryLine,
    });

    result.push(vscode.TextEdit.replace(range, newText));
    return result;
};

function activate(context) {
    const active = vscode.window.activeTextEditor;
    if (!active || !active.document) return;

    registerDocType('twig');

    function registerDocType(type) {
        if (vscodeConfig.hover === true) {
            context.subscriptions.push(
                vscode.languages.registerHoverProvider(type, {
                    provideHover(document, position, token) {
                        const range = document.getWordRangeAtPosition(position);
                        const word = document.getText(range);

                        for (const snippet in snippetsArr) {
                            if (
                                snippetsArr[snippet].prefix == word ||
                                snippetsArr[snippet].hover == word
                            ) {
                                return createHover(snippetsArr[snippet], type);
                            }
                        }

                        for (const snippet in functionsArr) {
                            if (
                                functionsArr[snippet].prefix == word ||
                                functionsArr[snippet].hover == word
                            ) {
                                return createHover(functionsArr[snippet], type);
                            }
                        }

                        for (const snippet in twigArr) {
                            if (
                                twigArr[snippet].prefix == word ||
                                twigArr[snippet].hover == word
                            ) {
                                return createHover(twigArr[snippet], type);
                            }
                        }
                    }
                })
            );
        }

        if (vscodeConfig.formatting === true) {
            context.subscriptions.push(
                vscode.languages.registerDocumentFormattingEditProvider(type, {
                    provideDocumentFormattingEdits: function(
                        document,
                        options,
                        token
                    ) {
                        const start = new vscode.Position(0, 0);
                        const end = new vscode.Position(
                            document.lineCount - 1,
                            document.lineAt(document.lineCount - 1).text.length
                        );
                        const rng = new vscode.Range(start, end);
                        return prettyDiff(document, rng, options);
                    }
                })
            );

            context.subscriptions.push(
                vscode.languages.registerDocumentRangeFormattingEditProvider(
                    type,
                    {
                        provideDocumentRangeFormattingEdits: function(
                            document,
                            range,
                            options,
                            token
                        ) {
                            let end = range.end;
                            if (end.character === 0) {
                                end = end.translate(-1, Number.MAX_VALUE);
                            } else {
                                end = end.translate(0, Number.MAX_VALUE);
                            }

                            const rng = new vscode.Range(
                                new vscode.Position(range.start.line, 0),
                                end
                            );

                            return prettyDiff(document, rng, options);
                        }
                    }
                )
            );
        }
    }
}

exports.activate = activate;
