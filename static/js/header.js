/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

// Header/footer support. The Plume macros emit one hidden `--pages-to-insert`
// div per non-empty zone, carrying the zone (header/footer), the position
// (left/center/right) and the exclude flags. `collectHeaderFooter` reads them
// and removes them from the body before pagination; `layoutPage` builds the
// header/content/footer slots of a page and clones the source content into
// them. The content slot is where pagination fills the flow, so the header and
// footer heights are accounted for.

// Read the `--pages-to-insert` divs, group them by zone, and remove them from
// the body so pagination never treats them as content.
function collectHeaderFooter(body) {
  const configs = { header: [], footer: [] };
  Array.from(body.querySelectorAll('.pages--to-insert')).forEach(div => {
    const zone = div.getAttribute('zone');
    const position = div.getAttribute('position');
    div.remove();
    if (zone !== 'header' && zone !== 'footer') return;
    if (position !== 'left' && position !== 'center' && position !== 'right') return;
    configs[zone].push({
      position,
      content: Array.from(div.childNodes),
      excludeFirst: div.hasAttribute('exclude-first'),
      excludeLast: div.hasAttribute('exclude-last'),
    });
  });
  return configs;
}

// Build the header/content/footer slots of a page. The header and footer are
// created only when a zone has content and is not excluded for this page.
// Returns the content slot (where pagination fills the flow).
function layoutPage(page, configs, pageIndex) {
  const content = document.createElement('div');
  content.className = 'pages--content';

  if (configs.header.length > 0 && !(pageIndex === 0 && configs.header.some(c => c.excludeFirst))) {
    page.appendChild(buildZone('header', configs.header));
  }
  page.appendChild(content);
  if (configs.footer.length > 0 && !(pageIndex === 0 && configs.footer.some(c => c.excludeFirst))) {
    page.appendChild(buildZone('footer', configs.footer));
  }
  return content;
}

// Create a header/footer slot with the three position divs, cloning the source
// content into the positions that have it. Empty positions stay empty (zero
// width) so `justify-content: space-between` lays out any subset correctly.
function buildZone(zone, configs) {
  const slot = document.createElement('div');
  slot.className = 'pages--' + zone;
  ['left', 'center', 'right'].forEach(position => {
    const cfg = configs.find(c => c.position === position);
    const pos = document.createElement('div');
    pos.className = 'pages--' + zone + '-' + position;
    if (cfg) {
      cfg.content.forEach(node => pos.appendChild(node.cloneNode(true)));
    }
    slot.appendChild(pos);
  });
  return slot;
}