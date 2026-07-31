# Changelog

All notable changes to this project will be documented in this file.

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
