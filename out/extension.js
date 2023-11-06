"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const prettydiff = require('prettydiff');
const filters_json_1 = __importDefault(require("./hover/filters.json"));
const functions_json_1 = __importDefault(require("./hover/functions.json"));
const twig_json_1 = __importDefault(require("./hover/twig.json"));
const editor = vscode.workspace.getConfiguration('editor');
const config = vscode.workspace.getConfiguration('twig-language-2');
function createHover(snippet, type) {
    const example = typeof snippet.example === 'undefined' ? '' : snippet.example;
    const description = typeof snippet.description === 'undefined' ? '' : snippet.description;
    return new vscode.Hover({
        language: type,
        value: description + '\n\n' + example
    });
}
function prettyDiff(document, range) {
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
}
;
function activate(context) {
    const active = vscode.window.activeTextEditor;
    if (!active || !active.document) {
        return;
    }
    ;
    registerDocType('twig');
    function registerDocType(type) {
        if (config.hover === true) {
            context.subscriptions.push(vscode.languages.registerHoverProvider(type, {
                provideHover(document, position) {
                    const range = document.getWordRangeAtPosition(position);
                    const word = document.getText(range);
                    const snippets = filters_json_1.default;
                    const functions = functions_json_1.default;
                    const twigs = twig_json_1.default;
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
                    }
                    else {
                        end = end.translate(0, Number.MAX_VALUE);
                    }
                    const rng = new vscode.Range(new vscode.Position(range.start.line, 0), end);
                    return prettyDiff(document, rng);
                }
            }));
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map