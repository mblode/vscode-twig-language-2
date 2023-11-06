import * as vscode from 'vscode';
const prettydiff = require('prettydiff');
import snippetsArr from './hover/filters.json';
import functionsArr from './hover/functions.json';
import twigArr from './hover/twig.json';

const editor = vscode.workspace.getConfiguration('editor');
const config = vscode.workspace.getConfiguration('twig-language-2');

type Snippet = {
    prefix?: string
    body: string
    text: string
    description?: string
    example?: string
    hover?: string
};

function createHover(snippet: Snippet, type: string) {
    const example = typeof snippet.example === 'undefined' ? '' : snippet.example;
    const description = typeof snippet.description === 'undefined' ? '' : snippet.description;
    return new vscode.Hover({
        language: type,
        value: description + '\n\n' + example
    });
}

function prettyDiff(document: vscode.TextDocument, range: vscode.Range) {
    const result = [];
    let output = "";
    let options = prettydiff.options;

    let tabSize = editor.tabSize;
    let indentChar = " ";

    if (config.tabSize > 0) {
        tabSize = config.tabSize;
    }

    if (config.indentStyle === "tab") {
        tabSize = 0;
        indentChar = "\t";
    }

    options.source = document.getText(range);
    options.mode = 'beautify';
    options.language = 'html';
    options.lexer = 'markup';
    options.brace_line = config.braceLine;
    options.brace_padding = config.bracePadding;
    options.brace_style = config.braceStyle;
    options.braces = config.braces;
    options.comment_line = config.commentLine;
    options.comments = config.comments;
    options.compressed_css = config.compressedCss;
    options.correct = config.correct;
    options.cssInsertLines = config.cssInsertLines;
    options.else_line = config.elseLine;
    options.end_comma = config.endComma;
    options.force_attribute = config.forceAttribute;
    options.force_indent = config.forceIndent;
    options.format_array = config.formatArray;
    options.format_object = config.formatObject;
    options.function_name = config.functionName;
    options.indent_level = config.indentLevel;
    options.indent_char = indentChar;
    options.indent_size = tabSize;
    options.method_chain = config.methodChain;
    options.never_flatten = config.neverFlatten;
    options.new_line = config.newLine;
    options.no_case_indent = config.noCaseIndent;
    options.no_lead_zero = config.noLeadZero;
    options.object_sort = config.objectSort;
    options.preserve = config.preserve;
    options.preserve_comment = config.preserveComment;
    options.quote_convert = config.quoteConvert;
    options.space = config.space;
    options.space_close = config.spaceSlose;
    options.tag_merge = config.tagMerge;
    options.tag_sort = config.tagSort;
    options.ternary_line = config.ternaryLine;
    options.unformatted = config.unformatted;
    options.variable_list = config.variableList;
    options.vertical = config.vertical;
    options.wrap = config.wrap;

    output = prettydiff();

    options.end = 0;
    options.start = 0;

    result.push(vscode.TextEdit.replace(range, output));
    return result;
};

export function activate(context: vscode.ExtensionContext): void {
    const active = vscode.window.activeTextEditor;
    if (!active || !active.document) {return;};

    registerDocType('twig');

    function registerDocType(type: string) {
        if (config.hover === true) {
            context.subscriptions.push(vscode.languages.registerHoverProvider(type, {
                provideHover(document, position) {
                    const range = document.getWordRangeAtPosition(position);
                    const word = document.getText(range);

                    const snippets: Record<string, Snippet> = snippetsArr as any;
                    const functions: Record<string, Snippet> = functionsArr as any;
                    const twigs: Record<string, Snippet> = twigArr as any;

                    for (const snippet in snippets) {
                        if (snippets[snippet].prefix === word || snippets[snippet].hover === word) {
                            return createHover(snippets[snippet], type);
                        }
                    }

                    for (const snippet in functions) {
                        if (functions[snippet].prefix === word || functions[snippet].hover === word) {
                            return createHover(functions[snippet], type);
                        }
                    }

                    for (const snippet in twigs) {
                        if (twigs[snippet].prefix === word || twigs[snippet].hover === word) {
                            return createHover(twigs[snippet], type);
                        }
                    }
                }
            }));
        }

        if (config.formatting === true) {
            context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(type, {
                provideDocumentFormattingEdits: function (document) {
                    const start = new vscode.Position(0, 0);

                    const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);

                    const rng = new vscode.Range(start, end);
                    return prettyDiff(document, rng);
                }
            }));

            context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(type, {
                provideDocumentRangeFormattingEdits: function (document, range) {
                    let end = range.end;

                    if (end.character === 0) {
                        end = end.translate(-1, Number.MAX_VALUE);
                    } else {
                        end = end.translate(0, Number.MAX_VALUE);
                    }

                    const rng = new vscode.Range(new vscode.Position(range.start.line, 0), end);
                    return prettyDiff(document, rng);
                }
            }));
        }
    }
}

