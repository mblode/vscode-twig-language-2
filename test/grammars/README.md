Test-only embedded grammars from Microsoft VS Code 1.85.2, MIT: https://github.com/microsoft/vscode/tree/1.85.2/extensions. These files are excluded from the VSIX.

`markdown.tmLanguage.json` is the unmodified Markdown grammar from the same VS Code 1.85.2 release. Markdown tests load it with the injection registrations from `package.json`, so they exercise the host grammar rather than a stand-in.
