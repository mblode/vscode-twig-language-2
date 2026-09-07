"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/hover/filters.json
var require_filters = __commonJS({
  "src/hover/filters.json"(exports2, module2) {
    module2.exports = {
      abs: {
        text: "abs",
        body: "abs",
        description: "filter returns the absolute value"
      },
      batch: {
        prefix: "batch",
        body: "batch(${size}, ${fill})",
        text: "batch(size, fill)",
        description: 'filter "batches" items by returning a list of lists with the given number of items. A second parameter can be provided and used to fill in missing items'
      },
      capitalize: {
        text: "capitalize",
        body: "capitalize",
        description: "filter capitalizes a value. The first character will be uppercase, all others lowercase"
      },
      convert_encoding: {
        prefix: "convert_encoding",
        body: "convert_encoding('${to}', '${from}')",
        text: "convert_encoding('to', 'from')",
        description: "filter converts a string from one encoding to another. The first argument is the expected output charset and the second one is the input charset"
      },
      date: {
        prefix: "date",
        body: 'date("${m/d/Y}")',
        text: 'date("m/d/Y")',
        description: "filter formats a date to a given format"
      },
      date_modify: {
        prefix: "date_modify",
        body: 'date_modify("${+1 day}")',
        text: 'date_modify("+1 day")',
        description: "filter modifies a date with a given modifier string"
      },
      default: {
        prefix: "default",
        body: "default('${default value}')",
        text: "default('default value')",
        description: "filter returns the passed default value if the value is undefined or empty, otherwise the value of the variable"
      },
      escape: {
        text: "escape",
        body: "escape",
        description: "filter escapes a string for safe insertion into the final output. It supports different escaping strategies depending on the template context"
      },
      first: {
        text: "first",
        body: "first",
        description: 'filter returns the first "element" of a sequence, a mapping, or a string'
      },
      format: {
        prefix: "format",
        body: "format($1)",
        text: "format()",
        description: "filter formats a given string by replacing the placeholders (placeholders follows the sprintf notation)",
        example: '{% set foo = "foo" %}\n{{ "I like %s and %s."| format(foo, "bar") }}\n\n{# outputs I like foo and bar #}'
      },
      join: {
        prefix: "join",
        body: "join${('optional')}",
        text: "join",
        description: "filter returns a string which is the concatenation of the items of a sequence"
      },
      json_encode: {
        prefix: "json_encode",
        body: "json_encode()",
        text: "json_encode()",
        description: "filter returns the JSON representation of a value. Internally, Twig uses the PHP json_encode function."
      },
      keys: {
        text: "keys",
        body: "keys",
        description: "filter returns the keys of an array. It is useful when you want to iterate over the keys of an array"
      },
      last: {
        text: "last",
        body: "last",
        description: 'filter returns the last "element" of a sequence, a mapping, or a string'
      },
      length: {
        text: "length",
        body: "length",
        description: "filter returns the number of items of a sequence or mapping, or the length of a string"
      },
      lower: {
        text: "lower",
        body: "lower",
        description: "filter converts a value to lowercase"
      },
      merge: {
        prefix: "merge",
        body: "merge(${array})",
        text: "merge(array)",
        description: "filter merges an array with another array"
      },
      nl2br: {
        text: "nl2br",
        body: "nl2br",
        description: "filter inserts HTML line breaks before all newlines in a string"
      },
      number_format: {
        prefix: "number_format",
        body: "number_format(${0}, '${.}', '${,}')",
        text: "number_format",
        description: "filter formats numbers. It is a wrapper around PHP's number_format function"
      },
      raw: {
        text: "raw",
        body: "raw",
        description: 'filter marks the value as being "safe", which means that in an environment with automatic escaping enabled this variable will not be escaped if raw is the last filter applied to it.'
      },
      replace: {
        prefix: "replace",
        body: "replace('${search}' : '${replace}')",
        text: "replace('search' : 'replace')",
        description: "filter formats a given string by replacing the placeholders."
      },
      reverse: {
        text: "reverse",
        body: "reverse",
        description: "filter reverses a sequence, a mapping, or a string"
      },
      round: {
        prefix: "round",
        body: "${0} | round(1, '${floor}')",
        text: "round",
        description: "filter rounds a number to a given precision"
      },
      slice: {
        prefix: "slice",
        body: "slice(${start}, ${length})",
        text: "slice(start, length)",
        description: "filter extracts a slice of a sequence, a mapping, or a string"
      },
      "slice [] notation": {
        prefix: "slice [] notation",
        body: "[${start}:${length}]",
        description: "filter extracts a slice of a sequence, a mapping, or a string"
      },
      sort: {
        text: "sort",
        body: "sort",
        description: "filter sorts an array"
      },
      split: {
        prefix: "split",
        body: "split('$1')",
        text: "split('')",
        description: "filter splits a string by the given delimiter and returns a list of strings"
      },
      striptags: {
        text: "striptags",
        body: "striptags",
        description: "filter strips SGML/XML tags and replace adjacent whitespace by one space"
      },
      title: {
        text: "title",
        body: "title",
        description: "filter returns a titlecased version of the value. Words will start with uppercase letters, all remaining characters are lowercase"
      },
      trim: {
        text: "trim",
        body: "trim",
        description: "filter strips whitespace (or other characters) from the beginning and end of a string"
      },
      "trim()": {
        prefix: "trim()",
        body: "trim('$1')",
        description: "filter strips whitespace (or other characters) from the beginning and end of a string"
      },
      upper: {
        text: "upper",
        body: "upper",
        description: "filter converts a value to uppercase"
      },
      url_encode: {
        text: "url_encode",
        body: "url_encode",
        description: "filter percent encodes a given string as URL segment or an array as query string"
      }
    };
  }
});

// src/hover/functions.json
var require_functions = __commonJS({
  "src/hover/functions.json"(exports2, module2) {
    module2.exports = {
      attribute: {
        prefix: "attribute",
        body: "{{ attribute($1) }}$2",
        description: 'The attribute function can be used to access a "dynamic" attribute of a variable',
        example: ""
      },
      block: {
        prefix: "block",
        body: "{{ block('${block name}') }}$1",
        description: "When a template uses inheritance and if you want to print a block multiple times, use the block function",
        example: ""
      },
      constant: {
        prefix: "constant",
        body: "{{ constant('${const name}') }}$1",
        description: "constant returns the constant value for a given string",
        example: "{{ some_date | date(constant('DATE_W3C')) }}\n{{ constant('Namespace\\Classname::CONSTANT_NAME') }}"
      },
      cycle: {
        prefix: "cycle",
        body: "{{ cycle(${array}, ${position}) }}$1",
        description: "The cycle function cycles on an array of values",
        example: ""
      },
      date: {
        prefix: "date",
        body: "{% set ${currentDate} = date($1) %}$2",
        description: "Converts an argument to a date to allow date comparison",
        example: "{% date() %}\n{% date('-2days') %}\n{% date('-2days', 'Europe/Paris') %}"
      },
      dump: {
        prefix: "dump",
        body: "{{ dump(${array}) }}$1",
        description: "(function) dumps information about a template variable. This is mostly useful to debug a template that does not behave as expected by introspecting its variables",
        example: ""
      },
      include: {
        prefix: "include function",
        body: "{{ include('${filename}.twig') }}$1",
        description: "(function) returns the rendered content of a template",
        example: ""
      },
      max: {
        prefix: "max",
        body: "{% set ${result} = max(${array}) %}$1",
        description: "(function) returns the biggest value of a sequence or a set of values",
        example: '{{ max(1, 3, 2) }}\n{# returns "3" #}\n\n{{ max({2: "e", 3: "a", 1: "b", 5: "d", 4: "c"}) }}\n{# returns "e" #}'
      },
      min: {
        prefix: "min",
        body: "{% set ${result} = min(${array}) %}$1",
        description: "(function) returns the lowest value of a sequence or a set of values",
        example: '{{ min(1, 3, 2) }}\n{# returns "1" #}\n\n{{ min({2: "e", 3: "a", 1: "b", 5: "d", 4: "c"}) }}\n{# returns "a" #}'
      },
      parent: {
        prefix: "parent",
        body: "{{ parent() }}",
        description: "(function) return the content of the block as defined in the base template",
        example: '{% extends "base.html" %}\n\n{% block sidebar %}\n	<h3>Table Of Contents</h3>\n	...\n	{{ parent() }}\n{% endblock %}'
      },
      random: {
        prefix: "random",
        hover: "",
        body: "{% set ${result} = random($1) %}$2",
        description: "(function) returns a random value depending on the supplied parameter type",
        example: "{{ random(['apple', 'orange', 'citrus']) }}\n{# example output: orange #}\n\n{{ random('ABC') }}\n{# example output: C #}\n\n{{ random() }}\n{# example output: 15386094 (works as the native PHP mt_rand function) #}\n\n{{ random(5) }}\n{# example output: 3 #}"
      },
      "range set": {
        prefix: "range set",
        body: "{% set ${result} = range(${low}, ${high}, ${step}) %}$1",
        description: "(function) Returns an array of elements from low to high, inclusive",
        example: "{% set result = range(0, 6, 2) %}\n{% dump(result) %}\n{# output: array(0, 2, 4, 6) #}"
      },
      range: {
        prefix: "range",
        body: "range(${low}, ${high}, ${step})",
        description: "(function) Returns an array of elements from low to high, inclusive",
        example: "{% set result = range(0, 6, 2) %}\n{% dump(result) %}\n{# output: array(0, 2, 4, 6) #}"
      },
      source: {
        prefix: "source",
        body: "{{ source('${template}.twig') }}$1",
        description: "(function) returns the content of a template without rendering it",
        example: ""
      },
      template_from_string: {
        prefix: "template_from_string",
        body: '{{ include(template_from_string("$1")) }}$2',
        description: "(function) loads a template from a string",
        example: '{{ include(template_from_string("Hello {{ name }}")) }}'
      }
    };
  }
});

// src/hover/twig.json
var require_twig = __commonJS({
  "src/hover/twig.json"(exports2, module2) {
    module2.exports = {
      show: {
        prefix: "show",
        body: "{{ $1 }}",
        description: "{{ }}"
      },
      execute: {
        prefix: "execute",
        body: "{% $1 %}",
        description: "{% %}"
      },
      autoescape: {
        prefix: "autoescape",
        body: ["{% autoescape %}", "	$1", "{% endautoescape %}"],
        description: "Whether automatic escaping is enabled or not, you can mark a section of a template to be escaped or not by using the autoescape tag",
        example: "{% autoescape %}\n    Everything will be automatically escaped in this block\n    using the HTML strategy\n{% endautoescape %}\n\n{% autoescape 'html' %}\n    Everything will be automatically escaped in this block\n    using the HTML strategy\n{% endautoescape %}\n\n{% autoescape 'js' %}\n    Everything will be automatically escaped in this block\n    using the js escaping strategy\n{% endautoescape %}\n\n{% autoescape false %}\n    Everything will be outputted as is in this block\n{% endautoescape %}"
      },
      block: {
        prefix: "block",
        body: ["{% block ${name} %}", "	$1", "{% endblock ${name} %}"],
        description: "When a template uses inheritance and if you want to print a block multiple times, use the block function"
      },
      do: {
        prefix: "do",
        body: ["{% do $1 %}"],
        description: "The do tag works exactly like the regular variable expression ({{ ... }}) just that it doesn't print anything",
        example: "{% do 1 + 2 %}"
      },
      embed: {
        prefix: "embed",
        body: ['{% embed "${filename}.twig" %}', "	$1", "{% endembed  %}"],
        description: "The embed tag combines the behaviour of include and extends. It allows you to include another template's contents, just like include does. But it also allows you to override any block defined inside the included template, like when extending a template"
      },
      extends: {
        prefix: "extends",
        body: '{% extends "${filename}.twig" %}',
        description: "Twig snippets"
      },
      filter: {
        prefix: "filter",
        body: ["{% filter ${filter name} %}", "	$1", "{% endfilter  %}"],
        description: "Filter sections allow you to apply regular Twig filters on a block of template data. Just wrap the code in the special filter section",
        example: '{% filter lower | escape %}\n    <strong>SOME TEXT</strong>\n{% endfilter %}\n\n{# outputs "&lt;strong&gt;some text&lt;/strong&gt;" #}'
      },
      flush: {
        prefix: "flush",
        body: ["{% flush %}"],
        description: "The flush tag tells Twig to flush the output buffer",
        example: "{% flush %}"
      },
      for: {
        prefix: "for",
        body: ["{% for ${row} in ${array} %}", "	$1", "{% endfor %}"],
        description: "Loop over each item in a sequence"
      },
      "for if": {
        prefix: "for if",
        body: [
          "{% for ${row} in ${array} if ${condition} %}",
          "	$1",
          "{% endfor %}"
        ],
        description: "Loop over each item in a sequence"
      },
      "for else": {
        prefix: "for else",
        body: [
          "{% for ${row} in ${array} %}",
          "	$1",
          "{% else %}",
          "	$2",
          "{% endfor %}"
        ],
        description: "Loop over each item in a sequence"
      },
      "for if else": {
        prefix: "for if else",
        body: [
          "{% for ${row} in ${array} if ${condition} %}",
          "	$1",
          "{% else %}",
          "	$2",
          "{% endfor %}"
        ],
        description: "Loop over each item in a sequence"
      },
      loop: {
        prefix: "loop",
        body: "loop.",
        description: "special variables inside of a for loop block"
      },
      if: {
        prefix: "if",
        body: ["{% if ${condition} %}", "	$1", "{% endif %}"],
        description: "The if statement in Twig is comparable with the if statements of PHP"
      },
      "if else": {
        prefix: "if else",
        body: [
          "{% if ${condition} %}",
          "	$1",
          "{% else %}",
          "	$2",
          "{% endif %}"
        ],
        description: "The if statement in Twig is comparable with the if statements of PHP"
      },
      else: {
        prefix: "else",
        body: "{% else %}",
        description: "The if statement in Twig is comparable with the if statements of PHP"
      },
      "else if": {
        prefix: "else if",
        body: "{% elseif ${condition} %}",
        description: "The if statement in Twig is comparable with the if statements of PHP"
      },
      import: {
        prefix: "import",
        body: '{% import "${filename}.twig" as ${alias}%}',
        description: "Twig supports putting often used code into macros. These macros can go into different templates and get imported from there."
      },
      _self: {
        prefix: "_self",
        body: "_self",
        description: "To import macros from the current file, use the special _self variable for the source"
      },
      include: {
        prefix: "include",
        body: '{% include "${filename}.twig" %}',
        description: "The include statement includes a template and returns the rendered content of that file into the current namespace"
      },
      macro: {
        prefix: "macro",
        body: ["{% macro ${name}($1) %}", "	$2", "{% endmacro %}"],
        description: "Twig snippets"
      },
      sandbox: {
        prefix: "sandbox",
        body: ["{% sandbox %}", "	$1", "{% endsandbox %}"],
        description: "The sandbox tag can be used to enable the sandboxing mode for an included template, when sandboxing is not enabled globally for the Twig environment"
      },
      set: {
        prefix: "set",
        body: ["{% set ${name} = ${value} %}$1"],
        description: "Assign values to variables"
      },
      "set block": {
        prefix: "set (block)",
        body: ["{% set ${name} %}", "	$1", "{% endset %}"],
        description: "Inside code blocks you can also assign values to variables. Assignments use the set tag and can have multiple targets"
      },
      spaceless: {
        prefix: "spaceless",
        body: ["{% spaceless %}", "	$1", "{% endspaceless %}"],
        description: "Use the spaceless tag to remove whitespace between HTML tags, not whitespace within HTML tags or whitespace in plain text"
      },
      use: {
        prefix: "use",
        body: '{% use "${filename}.twig" %}',
        description: "Twig snippets"
      },
      verbatim: {
        prefix: "verbatim",
        body: ["{% verbatim %}", "	$1", "{% endverbatim %}"],
        description: "The verbatim tag marks sections as being raw text that should not be parsed. For example to put Twig syntax as example into a template you can use this snippet"
      }
    };
  }
});

// src/formatter/service.js
var require_service = __commonJS({
  "src/formatter/service.js"(exports2, module2) {
    "use strict";
    var { Worker } = require("node:worker_threads");
    function runFormatter2(workerPath, source, options, range, cancellation, timeout = 5e3) {
      if (cancellation?.isCancellationRequested)
        return { promise: Promise.resolve([]), dispose() {
        } };
      if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024) {
        return {
          promise: Promise.reject(
            new Error("Document exceeds the 2 MiB formatting limit")
          ),
          dispose() {
          }
        };
      }
      const worker = new Worker(workerPath, {
        workerData: { source, options, range }
      });
      let settled = false, timer, subscription, finish;
      const promise = new Promise((resolve, reject) => {
        finish = (error, edits = []) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          subscription?.dispose();
          void worker.terminate();
          if (error) reject(error);
          else resolve(edits);
        };
        worker.once(
          "message",
          (result) => finish(result.error ? new Error(result.error) : null, result.edits)
        );
        worker.once("error", (error) => finish(error));
        worker.once("exit", (code) => {
          if (!settled)
            finish(
              new Error(`Formatter worker exited before returning edits (${code})`)
            );
        });
        timer = setTimeout(
          () => finish(new Error(`Formatting exceeded ${timeout} ms`)),
          timeout
        );
        subscription = cancellation?.onCancellationRequested(() => finish(null));
        if (cancellation?.isCancellationRequested) finish(null);
      });
      return {
        promise,
        dispose() {
          finish(null);
        }
      };
    }
    module2.exports = { runFormatter: runFormatter2 };
  }
});

// src/formatter/settings.js
var require_settings = __commonJS({
  "src/formatter/settings.js"(exports2, module2) {
    "use strict";
    function readOptions2(config, formatting) {
      const style = config.get("indentStyle", "editor");
      return {
        insertSpaces: style === "editor" ? formatting.insertSpaces : style === "space",
        tabSize: config.get("tabSize", 0) || formatting.tabSize,
        wrap: config.get("wrap", 0),
        forceAttribute: config.get("forceAttribute", false),
        spaceClose: config.get("spaceClose", false),
        newLine: config.get("newLine", true),
        embeddedFormatting: config.get("embeddedFormatting", true)
      };
    }
    function matchesIgnore2(patterns, paths) {
      return patterns.some((pattern) => {
        if (typeof pattern !== "string" || !pattern) return false;
        let regex = "";
        const normalized = pattern.replace(/\\/g, "/");
        for (let i = 0; i < normalized.length; i++) {
          const c = normalized[i];
          if (c === "*" && normalized[i + 1] === "*") {
            i++;
            if (normalized[i + 1] === "/") {
              i++;
              regex += "(?:.*/)?";
            } else regex += ".*";
          } else if (c === "*") regex += "[^/]*";
          else if (c === "?") regex += "[^/]";
          else regex += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        const re = new RegExp("^" + regex + "(?:/.*)?$");
        return paths.some((path2) => re.test(path2.replace(/\\/g, "/")));
      });
    }
    module2.exports = { readOptions: readOptions2, matchesIgnore: matchesIgnore2 };
  }
});

// src/extension.js
var vscode = require("vscode");
var path = require("node:path");
var snippets = [
  ...Object.values(require_filters()),
  ...Object.values(require_functions()),
  ...Object.values(require_twig())
];
var { runFormatter } = require_service();
var { readOptions, matchesIgnore } = require_settings();
function activate(context) {
  const pending = /* @__PURE__ */ new Map();
  const output = vscode.window.createOutputChannel("Twig Language 2");
  context.subscriptions.push(output, {
    dispose() {
      for (const request of pending.values()) request.dispose();
      pending.clear();
    }
  });
  const configFor = (document) => vscode.workspace.getConfiguration("twig-language-2", {
    uri: document.uri,
    languageId: document.languageId
  });
  async function provideEdits(document, options, cancellation, selection) {
    const config = configFor(document);
    if (!config.get("formatting", true) || cancellation.isCancellationRequested)
      return [];
    const filename = document.uri.fsPath;
    if (matchesIgnore(config.get("ignore", []), [
      filename,
      path.basename(filename),
      vscode.workspace.asRelativePath(document.uri, false)
    ]))
      return [];
    const key = document.uri.toString();
    pending.get(key)?.dispose();
    const source = document.getText(), version = document.version;
    let range;
    if (selection) {
      if (selection.isEmpty) return [];
      const lastLine = selection.end.character === 0 ? Math.max(selection.start.line, selection.end.line - 1) : selection.end.line;
      range = {
        start: document.offsetAt(new vscode.Position(selection.start.line, 0)),
        end: document.offsetAt(document.lineAt(lastLine).range.end)
      };
    }
    const timeout = Math.min(
      3e4,
      Math.max(100, config.get("formatTimeout", 5e3))
    );
    let request;
    try {
      request = runFormatter(
        context.asAbsolutePath("extension/formatter.js"),
        source,
        {
          ...readOptions(config, options),
          eol: document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n"
        },
        range,
        cancellation,
        timeout
      );
      pending.set(key, request);
      const edits = await request.promise;
      if (document.version !== version || document.isClosed || cancellation.isCancellationRequested)
        return [];
      return edits.map(
        (edit) => vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(edit.start),
            document.positionAt(edit.end)
          ),
          edit.text
        )
      );
    } catch (error) {
      output.appendLine(
        `Formatting skipped: ${error.message}. No edits applied.`
      );
      vscode.window.setStatusBarMessage(
        `Twig: formatting skipped (${error.message})`,
        5e3
      );
      return [];
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  }
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("twig", {
      provideDocumentFormattingEdits: (document, options, token) => provideEdits(document, options, token)
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider("twig", {
      provideDocumentRangeFormattingEdits: (document, range, options, token) => provideEdits(document, options, token, range)
    }),
    vscode.languages.registerHoverProvider("twig", {
      provideHover(document, position) {
        if (!configFor(document).get("hover", true)) return;
        const range = document.getWordRangeAtPosition(position);
        if (!range) return;
        const word = document.getText(range);
        const snippet = snippets.find(
          (item) => item.prefix === word || item.hover === word
        );
        if (snippet)
          return new vscode.Hover({
            language: "twig",
            value: (snippet.description || "") + "\n\n" + (snippet.example || "")
          });
      }
    })
  );
}
exports.activate = activate;
