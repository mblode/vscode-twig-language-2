import vscode from 'vscode'
import prettydiff from 'prettydiff'
import snippetsArr from './hover/filters.json'
import functionsArr from './hover/functions.json'
import twigArr from './hover/twig.json'

const editor = vscode.workspace.getConfiguration('editor');
const config = vscode.workspace.getConfiguration('twig-language-2');

function createHover(snippet, type) {
    const example = typeof snippet.example == 'undefined' ? '' : snippet.example
    const description = typeof snippet.description == 'undefined' ? '' : snippet.description
    return new vscode.Hover({
        language: type,
        value: description + '\n\n' + example
    });
}

function prettyDiff(document, range) {
    const result = [];
    const source = document.getText(range);
    let output = "";
    const defaults = prettydiff.defaults;

    let tabSize = editor.tabSize;

    if (config.tabSize > 0) {
        tabSize = config.tabSize;
    }

    const rules = {
        mode: 'beautify',
        language: 'html',
        lexer: 'markup',
        brace_line: config.braceLine,
        brace_padding: config.bracePadding,
        brace_style: config.braceStyle,
        braces: config.braces,
        comment_line: config.commentLine,
        comments: config.comments,
        compressed_css: config.compressedCss,
        correct: config.correct,
        cssInsertLines: config.cssInsertLines,
        else_line: config.elseLine,
        end_comma: config.endComma,
        force_attribute: config.forceAttribute,
        force_indent: config.forceIndent,
        format_array: config.formatArray,
        format_object: config.formatObject,
        function_name: config.functionName,
        indent_level: config.indentLevel,
        indent_size: tabSize,
        method_chain: config.methodChain,
        never_flatten: config.neverFlatten,
        new_line: config.newLine,
        no_case_indent: config.noCaseIndent,
        no_lead_zero: config.noLeadZero,
        object_sort: config.objectSort,
        preserve: config.preserve,
        preserve_comment: config.preserveComment,
        quote_convert: config.quoteConvert,
        space: config.space,
        space_close: config.spaceSlose,
        tag_merge: config.tagMerge,
        tag_sort: config.tagSort,
        ternary_line: config.ternaryLine,
        unformatted: config.unformatted,
        variable_list: config.variableList,
        vertical: config.vertical,
        wrap: config.wrap
    };

    let settings = Object.assign({}, defaults, rules, {source});

    output = prettydiff.mode(settings);
    settings.end = 0;
    settings.start = 0;
    result.push(vscode.TextEdit.replace(range, output));
    return result;
};

function activate(context) {
    const active = vscode.window.activeTextEditor
    if (!active || !active.document) return

    registerDocType('twig');

    function registerDocType(type) {
        if (config.hover === true) {
            context.subscriptions.push(vscode.languages.registerHoverProvider(type, {
                provideHover(document, position) {
                    const range = document.getWordRangeAtPosition(position);
                    const word = document.getText(range);

                    for (const snippet in snippetsArr) {
                        if (snippetsArr[snippet].prefix == word || snippetsArr[snippet].hover == word) {
                            return createHover(snippetsArr[snippet], type)
                        }
                    }

                    for (const snippet in functionsArr) {
                        if (functionsArr[snippet].prefix == word || functionsArr[snippet].hover == word) {
                            return createHover(functionsArr[snippet], type)
                        }
                    }

                    for (const snippet in twigArr) {
                        if (twigArr[snippet].prefix == word || twigArr[snippet].hover == word) {
                            return createHover(twigArr[snippet], type)
                        }
                    }
                }
            }));
        }

        if (config.formatting === true) {
            context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(type, {
                provideDocumentFormattingEdits: function (document) {
                    const start = new vscode.Position(0, 0)

                    const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);

                    const rng = new vscode.Range(start, end)
                    return prettyDiff(document, rng);
                }
            }));

            context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(type, {
                provideDocumentRangeFormattingEdits: function (document, range) {
                    let end = range.end

                    if (end.character === 0) {
                        end = end.translate(-1, Number.MAX_VALUE);
                    } else {
                        end = end.translate(0, Number.MAX_VALUE);
                    }

                    const rng = new vscode.Range(new vscode.Position(range.start.line, 0), end)
                    return prettyDiff(document, rng);
                }
            }));
        }
    }
}

exports.activate = activate;
