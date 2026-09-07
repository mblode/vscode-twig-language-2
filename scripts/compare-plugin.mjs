import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
if (!process.argv[2])
  throw new Error(
    "Pass a temporary directory containing prettier@3.9.6 and @zackad/prettier-plugin-twig@0.17.0",
  );
const resolve = createRequire(path.resolve(process.argv[2], "package.json"));
const prettier = resolve("prettier");
const twig = (
  await import(pathToFileURL(resolve.resolve("@zackad/prettier-plugin-twig")))
).default;
const cases = {
  attribute:
    '<div class="{% if loop.index < currentStep %}opacity-50{% endif %}">{{ step.title }}</div>',
  wrapper:
    "<div>\n{% if label %}\n<div>\n{% endif %}\n<input>\n{% if label %}\n</div>\n{% endif %}\n</div>",
  verbatim: "{% verbatim %}{{  literal }}\n   <unclosed>{% endverbatim %}",
};
for (const [name, source] of Object.entries(cases)) {
  try {
    console.log(
      JSON.stringify({
        name,
        source,
        formatted: await prettier.format(source, {
          parser: "twig",
          plugins: [twig],
          tabWidth: 2,
        }),
      }),
    );
  } catch (error) {
    console.log(JSON.stringify({ name, error: error.message }));
  }
}
