import * as vscode from 'vscode';
import { EditProvider } from './EditProvider';

const snippetsArr = require('./hover/filters.json');
const functionsArr = require('./hover/functions.json');
const twigArr = require('./hover/twig.json');
const lang = 'twig';
const twigConfig = vscode.workspace.getConfiguration('twig-language-2');

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

export function activate(context: vscode.ExtensionContext) {
	const active = vscode.window.activeTextEditor;
	if (!active || !active.document) return;

	const documentSelector: vscode.DocumentSelector = { scheme: 'file', language: lang };

	registerDocType(lang);

	function registerDocType(type) {
		if (twigConfig.hover === true) {
			context.subscriptions.push(
				vscode.languages.registerHoverProvider(documentSelector, {
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
	}

	if (twigConfig.formatting === true) {
		const documentSelector: vscode.DocumentSelector = { scheme: 'file', language: lang };

		const editProvider = new EditProvider();

		context.subscriptions.push(
			vscode.languages.registerDocumentFormattingEditProvider(
				documentSelector,
				editProvider
			),
			vscode.languages.registerDocumentRangeFormattingEditProvider(
				documentSelector,
				editProvider
			)
		);
	}
}

// tslint:disable-next-line:no-empty
export function deactivate() {}

function vscodeSettings(): VSCodeSettings {
	return vscode.workspace.getConfiguration('twig-language-2') as any;
}

export interface VSCodeSettings {
	defaultConfig: string | null;
}
