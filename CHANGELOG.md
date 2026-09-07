## 0.12.0

- Share the Twig formatter and language assets across both extension IDs while preserving their existing settings and language modes.
- Fix embedded CSS/JavaScript/SCSS scope leakage, escaped strings, compact operators, custom element names, unquoted attributes, verbatim priority and argument-free default filters.
- Fix snippet scopes and the malformed Craft assets query; allow Twig delimiter completion immediately before HTML closing tags.
- Declare untrusted and virtual workspace support and use URI-aware ignore matching.
- Add HTML attribute/tag completion, hover and automatic closing tags through the bundled Microsoft HTML language service.

# Changelog

All notable changes to this project will be documented in this file.

## [0.11.0] - 2026-09-08

### Changed

- Replace PrettyDiff with a source-preserving Twig/HTML formatter. Twig comparisons and nested quotes inside attributes no longer pass through an HTML-only parser.
- Preserve attribute case/order, inline text, trim controls, raw regions and custom embedded blocks. Repeated formatting is stable across the regression corpus.
- Format safely parseable JavaScript/CSS with bundled Prettier; preserve ambiguous Twig-generated bodies.
- Follow current document indentation and apply settings changes immediately. Format selections with surrounding document context and return small edits.
- Isolate formatting in a worker with cancellation, stale-result protection, a time limit and a 2 MiB input limit. Incomplete tokens return no edits.
- Deprecate PrettyDiff-only transformations. Add file ignore globs, ignore regions, `embeddedFormatting` and `formatTimeout`. See README for migration details.
- Require VS Code 1.85+. Keep existing syntax highlighting, snippets and hover assets.

### Verification

- Add issue/review-derived regressions, historical source fixtures, repeated-format and literal-preservation checks, official Twig PHP lexer/render checks, and real VS Code document/selection/save tests.
- Add CI checks and verify the packaged extension independently of the development checkout.

## [0.10.0] - 2026-08-01

### Fixed

- The `spaceClose` setting is now applied. It was being read from a misspelled key, so enabling it never added the space to self-closing tags ([#105](https://github.com/mblode/vscode-twig-language-2/issues/105))
- The formatter is always registered on activation. It previously bailed out when no editor was active yet, causing intermittent "no formatter for twig installed" errors ([#111](https://github.com/mblode/vscode-twig-language-2/issues/111), [#115](https://github.com/mblode/vscode-twig-language-2/issues/115))
- `is not <test>` is highlighted, e.g. `is not empty` and `is not defined`. Added the `null` and `same as` tests ([#78](https://github.com/mblode/vscode-twig-language-2/issues/78))
- `verbatim` blocks are treated as raw text, so Twig-like symbols inside them no longer leak highlighting into the rest of the file ([#76](https://github.com/mblode/vscode-twig-language-2/issues/76))

### Added

- Highlighting for the Twig 3 `types` tag
- Auto-closing pairs, so typing `{{`, `{%`, or `{#` inserts the matching close with surrounding spaces ([#88](https://github.com/mblode/vscode-twig-language-2/issues/88))
- Pressing Enter between HTML tags now indents the same way the built-in HTML language does ([#59](https://github.com/mblode/vscode-twig-language-2/issues/59))
- `with`, `withb`, and `endwith` snippets

## [0.8.0] - 2019-04-17

### Changed

- Pretty Diff formatting bug has been solved correctly

### Added

- Added many more configuration options

## [0.7.0] - 2019-04-01

### Changed

- Fixed bug that clears entire document and only leaves the script tag
- Preserved new lines
- Updated packages
- Converted extension to ES6

## [0.6.0] - 2019-02-26

### Changed

- Updated snippets for Craft CMS 3

## [0.5.1] - 2019-01-31

## Added

- Add changelog (finally)

### Changed

- Update Prettydiff package to 100.1.7

## [0.4.4] - 2019-01-05

### Changed

- Move to Pretty Diff 3
- Clean up package.json
- Refactor format selection based on Unibeautify and Prettier
- Fix extension settings to match Pretty Diff 3's option changes
- Fix tab size issue
- Update readme to be more clear about limitations of the extension

## [0.3.2] - 2018-04-02

### Changed

- Fix issues with snippes
- Refine readme documentation

## [0.2.11] - 2018-01-20

### Added

- Create new extension based on Twig Language 1

### Changed

- Change name to Twig Language 2
- Update readme based on name change
- Change activation events
