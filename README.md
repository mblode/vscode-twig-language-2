<div align="center">

# [Twig Language 2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2)

**Syntax highlighting, snippets, hover hints, and Pretty Diff formatting for Twig templates in VS Code**

Open a `.twig` file and get highlighting, 113 Twig and Craft CMS snippets, and a formatter for the whole document or a selection.

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2">
    <img src="https://img.shields.io/visual-studio-marketplace/v/mblode.twig-language-2?style=flat&colorA=000000&colorB=000000" />
  </a>
  <a href="https://github.com/mblode/vscode-twig-language-2/blob/master/LICENSE.md">
    <img src="https://img.shields.io/github/license/mblode/vscode-twig-language-2?style=flat&colorA=000000&colorB=000000" />
  </a>
</p>

</div>

## Install

Search for `Twig Language 2` in the VS Code extensions view, or run this in the Quick Open bar
(`Cmd+P`):

```bash
ext install mblode.twig-language-2
```

## Quickstart

Open any `.twig` or `.html.twig` file. The language activates on its own and both `.twig` and
`.html.twig` are already associated with it.

Type a snippet prefix and press Tab:

```twig
{# type "ife" then Tab #}
{% if condition %}
	{# body #}
{% else %}
	{# body #}
{% endif %}
```

Then run Format Document (`Shift+Alt+F`). Formatting also works on a selection through Format
Selection. JSON, CSS, SCSS, JavaScript, and TypeScript inside a template are highlighted as
themselves.

## Snippets

113 prefixes, covering plain Twig and Craft CMS. A sample of what each expands to:

| Prefix | Expands to |
|---|---|
| `if`, `ife` | `{% if %}`, with an `{% else %}` branch |
| `for`, `fore` | `{% for item in items %}`, with an `{% else %}` branch |
| `block`, `extends`, `inc`, `embed` | template inheritance and includes |
| `set`, `macro`, `filter`, `verbatim` | the matching Twig tag pair |
| `entries`, `assets`, `categories`, `users` | a `craft.*` query loop |
| `cache`, `nav`, `paginate`, `switch`, `redirect` | Craft CMS tags |
| `formlogin`, `formuserregistration`, `formsearch` | a complete Craft form, CSRF token included |

Hovering a Twig tag, filter, or function shows what it does.
[`src/snippets/snippets.json`](src/snippets/snippets.json) is the full list.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `twig-language-2.hover` | `true` | Show hover information for Twig tags, filters, and functions. |
| `twig-language-2.formatting` | `true` | Register the Pretty Diff formatter for Twig files. |
| `twig-language-2.indentStyle` | `tab` | Indent with `tab` or `space`, ignoring the editor's own setting. |
| `twig-language-2.tabSize` | `0` | Width of one indent level, `0` to follow `editor.tabSize`. |
| `twig-language-2.wrap` | `0` | Character count to wrap at, `0` to leave lines alone. |

Another 34 Pretty Diff options are exposed under the same `twig-language-2.*` prefix; the extensions
view lists them all with their descriptions. Restart VS Code after changing any of them.

To treat plain `.html` files as Twig and get Emmet inside them:

```json
"files.associations": {
	"*.html": "twig"
},
"emmet.includeLanguages": {
	"twig": "html"
}
```

## Notes

- HTML Intellisense is not included. If you need it, use
  [Twig Language](https://github.com/mblode/vscode-twig-language) instead.
- [CHANGELOG.md](CHANGELOG.md) records what changed in each release.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
