
<a href="https://marketplace.visualstudio.com/items?itemName=mblode.twig-language">
  <img src="https://github.com/mblode/vscode-twig-language/blob/master/images/icon.png?raw=true" alt="" width=100 height=100>
</a>

### VSCode Twig Language

- Syntax highlighting
- Snippets
- Emmet
- Pretty Diff Formatting
- Hover
- HTML intellisense

## Table of contents

- [Installation](#installation)
- [Documentation](#documentation)
- [Optional VSCode Config](#optional-vscode-config)
- [Contribute](#contribute)
- [Running extension locally](#running-extension-locally)
- [Copyright and license](#copyright-and-license)

## Installation

Install through Visual Studio Code extensions. Search for `Twig Language`

[Visual Studio Code Market Place: Twig Language](https://marketplace.visualstudio.com/items?itemName=mblode.twig-language)

It can also be installed using:

```
ext install mblode.twig-language
```

## Use these VSCode settings

```
"vsicons.associations.files": [ { "icon": "twig", "extensions": ["twig", "html"], "format": "svg" } ],
"files.associations": {},
"emmet.includeLanguages": {},
```

## Documentation

Twig Language is a Visual Studio Code extension that provides [snippets](), [syntax highlighting](), [hover](), and [formatting]() for the Twig file format.

### Twig syntax highlighting and language support

This extension provides language support for the Twig syntax.

### Code formatter/beautifier for Twig files

Using PrettyDiff, this extension implements the only working code formatter for Twig files in VSCode.

#### Using Command Palette (CMD/CTRL + Shift + P)

```
1. CMD + Shift + P -> Format Document
```
OR
```
1. Select the text you want to Prettify
2. CMD + Shift + P -> Format Selection
```

### Information about Twig code on hover

VSCode Twig language shows information about the symbol/object that's below the mouse cursor when you hover within Twig files.


### Craft CMS/Twig code snippets

Adds a set of Craft CMS/Twig code snippets to use in your Twig templates.

#### Generic Triggers

```twig

do                {% do ... %}
extends           {% extends 'template' %}
from              {% from 'template' import 'macro' %}
import            {% import 'template' as name %}
importself        {% import _self as name %}
inc, include      {% include 'template' %}
incp              {% include 'template' with params %}
inckv             {% include 'template' with { key: value } %}
use               {% use 'template' %}

autoescape        {% autoescape 'type' %}...{% endautoescape %}
block, blockb     {% block name %} ... {% endblock %}
blockf            {{ block('...') }}
embed             {% embed "template" %}...{% endembed %}
filter, filterb   {% filter name %} ... {% endfilter %}
macro             {% macro name(params) %}...{% endmacro %}
set, setb         {% set var = value %}
spaceless         {% spaceless %}...{% endspaceless %}
verbatim          {% verbatim %}...{% endverbatim %}

if, ifb           {% if condition %} ... {% endif %}
ife               {% if condition %} ... {% else %} ... {% endif %}
for               {% for item in seq %} ... {% endfor %}
fore              {% for item in seq %} ... {% else %} ... {% endfor %}

else              {% else %}
endif             {% endif %}
endfor            {% endfor %}
endset            {% endset %}
endblock          {% endblock %}
endfilter         {% endfilter %}
endautoescape     {% endautoescape %}
endembed          {% endembed %}
endfilter         {% endfilter %}
endmacro          {% endmacro %}
endspaceless      {% endspaceless %}
endverbatim       {% endverbatim %}
```

#### Craft Triggers

```twig
asset                    craft.assets.first()
assets, assetso          craft.assets loop
categories, categorieso  craft.categories loop
entries, entrieso        craft.entries loop
feed                     craft.feeds.getFeedItems loop
t                        |t
replace                  |replace('search', 'replace')
replacex                 |replace('/(search)/i', 'replace')
split                    |split('\n')
tags, tagso              craft.tags loop
users, userso            craft.users loop

cache                    {% cache %}...{% endcache %}
children                 {% children %}
exit                     {% exit 404 %}
ifchildren               {% ifchildren %}...{% endifchildren %}
includecss               {% includecss %}...{% endincludecss %}
includecssfile           {% includeCssFile "/resources/css/global.css" %}
includehirescss          {% includehirescss %}...{% endincludehirescss %}
includejs                {% includejs %}...{% endincludejs %}
includejsfile            {% includeJsFile "/resources/js/global.js" %}
matrix, matrixif         Basic Matrix field loop using if statements
matrixifelse             Basic Matrix field loop using if/elseif
matrixswitch             Basic Matrix field loop using switch
nav                      {% nav item in items %}...{% endnav %}
paginate                 Outputs example of pagination and prev/next links
redirect                 {% redirect 'login' %}
requirelogin             {% requireLogin %}
requirepermission        {% requirePermission "spendTheNight" %}
switch                   {% switch variable %}...{% endswitch %}

csrf                     {{ getCsrfInput() }}
getfoothtml              {{ getFootHtml() }}
getheadhtml              {{ getHeadHtml() }}

getparam                 craft.request.getParam()
getpost                  craft.request.getPost()
getquery                 craft.request.getQuery()
getsegment               craft.request.getSegment()

case                     {% case "value" %}
endcache                 {% endcache %}
endifchildren            {% endifchildren %}
endincludecss            {% endincludecss %}
endincludehirescss       {% endincludehirescss %}
endincludejs             {% endincludejs %}
endnav                   {% endnav %}

ceil                     ceil()
floor                    floor()
max                      max()
min                      min()
round                    round()
shuffle                  shuffle()
random                   random()
url, urla                url('path'), url('path', params, 'http', false)

rss                      Example rss feed

dd                      <pre>{{ dump() }}</pre>{% exit %}
dump                    <pre>{{ dump() }}</pre>
```

#### Example Forms

```
formlogin                Example login form
formuserprofile          Example user profile form
formuserregistration     Example user registration form
formforgotpassword       Example forgot password form
formsetpassword          Example set password form
formsearch               Example search form
formsearchresults        Example search form results
```

## Settings

**twig-language.hover (default: true)**

Whether to enable/disable Twig hover.

**twig-language.formatting (default: true)**

Whether to enable/disable Twig PrettyDiff formatting.

**twig-language.newline (default: true)**

Whether to insert an empty line at the end of output.

**twig-language.objSort (default: 'none')**

Sorts properties of objects attributs in HTML.

- "all"
- "none"

**twig-language.wrap (default: 0)**

How many columns wide text content may be before wrapping onto a new line. The value 0 disables text wrapping.

**twig-language.methodchain (default: 'none')**

Whether consecutive methods should be continuously chained onto a single line of code.

- "chain"
- "indent"
- "none"

**twig-language.ternaryLine (default: true)**

Whether to keep ? and : operators of ternary statements on one line of code.

## Contribute

Feel free to open issues or Pull Requests!

## Running extension locally

1. Open this repository inside VSCode
2. `yarn install` or `npm install` in your terminal
3. Debug sidebar
4. `Launch Extension`

## Copyright and license

MIT © [Matthew Blode](https://matthewblode.com)
