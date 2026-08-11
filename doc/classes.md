# Special classes

Three classes are **structural markers** consumed by the JS passes in `js/page.js`.
They are distinct from the styling classes (`pages--text--bold`, `pages--list`, …):
they carry no visual style of their own — they tell the pagination/paragraphing
engine how to treat the element.

## `.pages--to-space`

> Marker: "this block should be followed by flexible spacing."

The `addSpacing` pass inserts a `<div class="pages--flow--vspace">` right after
every `.pages--to-space` element, and one as the last element of every page.
`.pages--flow--vspace` is a flexible spacer (`flex-grow: 1`, `max-height:
var(--vspace-max)`) that absorbs the leftover vertical space of the page.

**Where it is set:** on block components that should be followed by spacing —
`heading` (h1–h6), `hline`, `Blockquote`, `MainTitle`.

**How to use it:** put it on a block component whose trailing page space should
be absorbed. Do not put it on inline content.

## `.pages--to-flow`

> Marker: "this element's content is flow content to be auto-paragraphed."

The `autoParagraph` pass recurses into every `.pages--to-flow` element and groups
its inline children into `<p>`, exactly as it does for the body. Without this
class, the content of a nested container (e.g. a `Blockquote`) would not be
auto-paragraphed.

**Where it is set:** on flow containers — currently `Blockquote`. Any future
frame (flow container) must carry it.

**How to use it:** put it on a block container whose content is flow (paragraphs,
lists, …) and should be auto-paragraphed.

## `.pages--as-inline`

> Marker: "treat this element as inline content, part of the surrounding paragraph."

The `autoParagraph` pass decides inline vs block from `getComputedStyle().display`.
An element carrying `.pages--as-inline` is always treated as inline, even if its
CSS display is `block`, so it stays grouped with the surrounding text instead of
breaking the paragraph.

**Where it is set:** on `formula` (math.plume). A display formula renders as a
block, but it is part of the sentence; the class keeps it in the same `<p>` as
the surrounding text, so pagination never separates them.

**How to use it:** put it on an element that renders as a block but should be
treated as inline content (part of the paragraph).

## `.page`

> Container of a page, created by the pagination engine.

The `makePages` pass splits the body into `.page` elements (dimensions
`--page-width`/`--page-height`, margins, flex column). `addSpacing` and the
pagination CSS rely on it.

**⚠️ Never use it.** `.page` is **generated** by pagination. If you add it
manually, the guard `if (document.body.querySelector('.page')) return;` in
`makePages` assumes pagination already happened and **skips the whole split** —
the document is no longer paginated. It is reserved for the engine.

## `break-*` properties

> The pagination engine respects the CSS fragmentation properties
> `break-before`, `break-after` and `break-inside` (computed styles), so page
> breaks can be controlled from plain CSS — no class needed.

**`break-before: page`** — the element starts on a new page. If the element is
an empty div (a pure marker, e.g. `$newpage` which outputs
`<div style="break-before: page;"></div>`), it is dropped once the break is
done, so it never leaves a stray empty element.

**`break-after: page`** — the following content starts on a new page.

**`break-after: avoid`** / **`break-before: avoid`** — forbids a break between
the element and its neighbour (keep-with-next / keep-with-previous). Used to
avoid orphan titles: a heading with `break-after: avoid` is never left alone at
the bottom of a page. Consecutive `avoid` elements form a run that moves to the
next page together. `avoid` is a hint: if the run + the following element
cannot fit on a fresh page, the engine breaks anyway.

**`break-inside: avoid`** — already satisfied by the engine: it never splits an
element across pages (each child of the body is moved whole).

The legacy aliases `page-break-before`, `page-break-after`, `page-break-inside`
are mapped to `break-*` by the browser, so they work too.

**How to use it:** set the property in a static `.css` (or inline) on a block
element. `$newpage` is the ready-made marker for `break-before: page`.