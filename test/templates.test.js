"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { templateReferences, templateCandidates } = require("../src/templates");
test("template references cover tags, functions and arrays but not dynamic names", () => {
  const source = [
    '{% include("partials/_section_header.html.twig") %}',
    '{% extends request.ajax ? "base_ajax.html" : "base.html" %}',
    '{%- include ["a.twig", \'b.twig\'] ignore missing with {x: "hash.twig"} only -%}',
    '{{ include("fn.twig", {y: "arg.twig"}) }}{{ source("src.twig") }}{{ x.include("method.twig") }}',
    '{% from "macros.twig" import "macro" %}{% import "forms.html" as forms %}{% use "blocks.twig" with a as b %}',
    '{# {% include "comment.twig" %} #}{% verbatim %}{% include "raw.twig" %}{% endverbatim %}',
    '{% embed "embed.twig" %}{% endembed %}{% set y = include("dir/" ~ z) %}{{ include("#{z}.twig") }}',
    '<a href="plain.twig">{% include "@App/ns.twig" %}{% include "unclosed.twig"',
  ].join("\n");
  const refs = templateReferences(source);
  assert.deepEqual(
    refs.map((r) => r.name),
    [
      "partials/_section_header.html.twig",
      "base_ajax.html",
      "base.html",
      "a.twig",
      "b.twig",
      "fn.twig",
      "src.twig",
      "macros.twig",
      "forms.html",
      "blocks.twig",
      "embed.twig",
      "@App/ns.twig",
      "unclosed.twig",
    ],
  );
  for (const r of refs) assert.equal(source.slice(r.start, r.end), r.name);
});
test("template names resolve against roots, namespaces and Craft extensionless names", () => {
  const join = (base, name) => `${base}/${name}`;
  assert.deepEqual(
    templateCandidates("base.html.twig", ["/w/templates", "/w/doc"], {}, join),
    ["/w/templates/base.html.twig", "/w/doc/base.html.twig"],
  );
  assert.deepEqual(templateCandidates("_layout", ["/t"], {}, join), [
    "/t/_layout",
    "/t/_layout.twig",
    "/t/_layout.html.twig",
    "/t/_layout.html",
    "/t/_layout/index.twig",
    "/t/_layout/index.html",
  ]);
  assert.deepEqual(templateCandidates("./partials/x.twig", ["/t"], {}, join), [
    "/t/partials/x.twig",
  ]);
  assert.deepEqual(
    templateCandidates("@App/x.twig", ["/t"], { App: ["/ns", "/ns2"] }, join),
    ["/ns/x.twig", "/ns2/x.twig"],
  );
  assert.deepEqual(templateCandidates("@Unknown/x.twig", ["/t"], {}, join), []);
  assert.deepEqual(templateCandidates("", ["/t"], {}, join), []);
});
