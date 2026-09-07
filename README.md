<div align="center">

# [Twig Language 2](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2)

**Syntax highlighting, snippets, hover hints, and Twig formatting for Twig templates in VS Code**

Open a `.twig` file and get highlighting, 113 Twig and Craft CMS snippets, and a formatter for the whole document or a selection.

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=mblode.twig-language-2">
    <img src="https://vsmarketplacebadges.dev/version-short/mblode.twig-language-2.svg?style=flat&colorA=000000&colorB=000000" />
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

## Formatting

Version 0.11 replaces PrettyDiff with a formatter built for Twig and HTML. Run **Format Document**, **Format Selection**, or enable format on save:

```json
"[twig]": {
  "editor.defaultFormatter": "mblode.twig-language-2",
  "editor.formatOnSave": true,
  "editor.insertSpaces": true,
  "editor.tabSize": 2
}
```

Twig expressions are recognized before HTML attributes, so comparisons and nested quotes stay intact. Formatting preserves attribute case and order, inline text boundaries, string contents, comments, whitespace trim markers, and raw/verbatim/pre/textarea bodies. HTML and Twig nesting are tracked separately to support conditional HTML wrappers. Selection formatting uses the surrounding document's indentation and edits only complete selected lines.

JavaScript and CSS in `script`/`style` elements use bundled Prettier when safely parseable. Twig-generated code that cannot be parsed independently, custom `js`/`css`/`scss` blocks, data scripts, and multiline Twig expressions stay unchanged. No PHP, Rust, project dependencies, or Prettier configuration is required. Workspace Prettier plugins and Tailwind class sorting are not loaded.

Existing line breaks and blank lines are retained; inline elements and text are not expanded or reflowed. Leading line indentation can change rendered whitespace, especially with CSS `white-space` rules or captured template output. Keep exact-whitespace sections inside an ignore region:

```twig
{# twig-ignore-start #}
  content to keep exactly as written
{# twig-ignore-end #}
```

HTML comment markers and paired `prettier-ignore-start/end` and legacy `parse-ignore-start/end` markers also work. Unclosed tokens return no edits and a short status message, with details in the **Twig Language 2** Output channel. Formatting runs in a cancellable worker with a 2 MiB document limit.

## Configuration

Settings apply immediately and support workspace, folder, and `[twig]` overrides.

| Setting | Default | Description |
|---|---|---|
| `twig-language-2.hover` | `true` | Show Twig hover hints. |
| `twig-language-2.formatting` | `true` | Enable document and selection formatting. |
| `twig-language-2.indentStyle` | `editor` | Follow the current document, or override with `space` / `tab`. |
| `twig-language-2.tabSize` | `0` | Indent width; `0` follows the current document. |
| `twig-language-2.wrap` | `0` | Preferred HTML attribute width; `0` preserves wrapping. Embedded code uses 80 when unset. |
| `twig-language-2.forceAttribute` | `false` | Put each HTML attribute on its own line. |
| `twig-language-2.spaceClose` | `false` | Add a space before `/>`. |
| `twig-language-2.newLine` | `true` | Add a final newline after a complete tag; preserve literal text tails. |
| `twig-language-2.embeddedFormatting` | `true` | Format supported JavaScript/CSS bodies with Prettier. |
| `twig-language-2.ignore` | `[]` | File globs to skip, such as `**/vendor/**`. Supports `*`, `**`, and `?`. |
| `twig-language-2.formatTimeout` | `5000` | Maximum worker time in milliseconds, from 100 to 30000. |

### Migrating from 0.10

VS Code 1.85 or newer is required. Indentation now follows the document by default. Explicit `indentStyle` and `tabSize` overrides still work. EditorConfig support comes through extensions that set the document's indentation options.

PrettyDiff-only settings remain recognized as deprecated configuration keys but no longer transform code: `braceLine`, `bracePadding`, `braceStyle`, `braces`, `commentLine`, `comments`, `compressedCss`, `correct`, `cssInsertLines`, `elseLine`, `endComma`, `forceIndent`, `formatArray`, `formatObject`, `functionName`, `indentLevel`, `methodChain`, `neverFlatten`, `noCaseIndent`, `noLeadZero`, `objectSort`, `preserve`, `preserveComment`, `quoteConvert`, `space`, `tagMerge`, `tagSort`, `ternaryLine`, `unformatted`, `variableList`, and `vertical`.

Formatting never sorts attributes or tags, converts Twig quotes, merges HTML elements, or repairs missing syntax. Supported embedded languages use Prettier defaults. Use `formatting: false`, file globs, or paired ignore regions to opt out.

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

## Development

```sh
npm ci
composer install --working-dir=test/php
npm test
npm run test:oracle
npm run build
npm run test:extension
npm run package
```

Node 22+ is used for development tooling. PHP 8.2+ and Composer are needed only for the independent Twig lexer/render tests. `npm test` runs those tests when installed; `test:oracle` requires them. The extension has no PHP runtime dependency. `VSCODE_VERSION=stable npm run test:extension` checks the current VS Code release; the default checks the minimum supported version. `TWIG_EXTENSION_PATH` can point to an extracted VSIX for the same integration suite.

See the [formatter audit](docs/formatter-audit.md) for the complete issue, PR, and review index, coverage boundaries, and engine decision. The [release plan](docs/plans/twig-formatter.md) records implementation and verification.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)

## Language compatibility

Both Twig extensions now use the same formatter, grammar, language configuration and snippets. Twig Language 2 keeps the dedicated `twig` language ID and adds bundled Microsoft HTML completion, hover and automatic closing tags. Twig Language keeps the `html` language ID and native VS Code HTML IntelliSense. The extension IDs and setting namespaces remain compatible with existing installations. Choose one Twig extension as the default formatter for its language mode.

Highlighting regressions cover escaped quotes, compact `?:` operators, `default` without arguments, custom HTML elements, verbatim content, and embedded CSS/JS/SCSS boundaries. Invalid snippet language scopes and the malformed Craft assets query were corrected.

The extensions run in desktop and remote Node extension hosts (VS Code 1.85 or newer). They support untrusted and virtual workspaces without executing workspace code or loading project formatter plugins. A browser-only extension host is not currently provided.

The canonical shared implementation lives in this repository. `node scripts/sync-core.mjs ../vscode-twig-language` or `../vscode-pretty-formatter` copies an explicit source-file list and records hashes in `.twig-core.json`. Each distribution's tests reject local drift from that pinned source. Package identity, settings and release versions stay in their own repositories.
