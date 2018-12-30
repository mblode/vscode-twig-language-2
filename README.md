<a href="https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2">
  <img src="https://github.com/mblode/vscode-twig-language-2/blob/master/images/icon.png?raw=true" alt="" width=100 height=100>
</a>

### VS Code Twig Language 2

* Syntax highlighting
* Snippets
* Emmet
* Pretty Diff 3 Formatting
* Hover

## What has changed since version 1?

I have created a new extension to fix the issues that I (and all of you) were having with file association, commenting and VS Code UI issues.

Simply add these lines to your VS Code settings to get emmet working and also to associate HTML files as twig syntax.

```
"files.associations": {
    "*.html": "twig"
},
"emmet.includeLanguages": {
    "twig": "html"
},
```

## Installation

Install through Visual Studio Code extensions. Search for `Twig Language 2`

[Visual Studio Code Market Place: Twig Language 2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2)

## Documentation

Twig Language 2 is a Visual Studio Code extension that provides snippets, syntax highlighting, hover, and formatting for the Twig file format.

### Twig syntax highlighting and language support

This extension provides language support for the Twig syntax.

### Code formatter/beautifier for Twig files

Using PrettyDiff, this extension implements the only working code formatter for Twig files in VS Code.

### Information about Twig code on hover

VS Code Twig language 2 shows information about the symbol/object that's below the mouse cursor when you hover within Twig files.

### Craft CMS/Twig code snippets

Adds a set of Craft CMS/Twig code snippets to use in your Twig templates.
