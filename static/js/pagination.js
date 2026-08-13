/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

// Page numbers. `paginationConfig` (set by the Plume macro) is one of:
//   auto    (default) — active when the document has more than 2 pages
//   enable            — active on every page
//   disable           — inactive
//   x                 — active from page x excluded (skip x pages at the start)
//   x-y               — active from page x excluded until y pages before the end
// Invalid values are ignored (treated as auto). The number is inserted into the
// footer's left/right slot, alternating so odd pages put it on the right and
// even pages on the left. The footer is created on demand via buildZone; the
// conflict with a real footer is resolved later.

function parsePagination(config) {
  if (config === 'enable') return { mode: 'enable' };
  if (config === 'disable') return { mode: 'disable' };
  if (config === 'auto' || config === undefined || config === '') return { mode: 'auto' };
  const m = /^(\d+)(?:-(\d+))?$/.exec(config);
  if (m) {
    return {
      mode: 'range',
      start: parseInt(m[1], 10),
      end: m[2] !== undefined ? parseInt(m[2], 10) : 0,
    };
  }
  return { mode: 'auto' };
}

// Is the 1-based page number paginated under the given config and total?
function isPaginated(cfg, pageNumber, totalPages) {
  if (cfg.mode === 'disable') return false;
  if (cfg.mode === 'auto') return totalPages > 2;
  if (cfg.mode === 'enable') return true;
  return pageNumber > cfg.start && pageNumber <= totalPages - cfg.end;
}

function applyPagination() {
  const cfg = parsePagination(paginationConfig);
  const pages = document.querySelectorAll('.pages--page');
  const total = pages.length;
  pages.forEach((page, index) => {
    const pageNumber = index + 1;
    if (!isPaginated(cfg, pageNumber, total)) return;
    let footer = page.querySelector('.pages--footer');
    if (!footer) {
      footer = buildZone('footer', []);
      const content = page.querySelector('.pages--content');
      page.insertBefore(footer, content ? content.nextSibling : null);
    }
    const span = document.createElement('span');
    span.className = 'pages--page-number';
    span.textContent = String(pageNumber);
    const side = (pageNumber % 2 === 1) ? 'right' : 'left';
    footer.querySelector('.pages--footer-' + side).appendChild(span);
  });
}
