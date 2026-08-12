/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

// Captured during parsing, before MathJax (defer) consumes the math scripts.
const hasMath = !!document.querySelector('script[type^="math/"]');

// Signal de fin de rendu pour l'hôte (Calame) : se résout une fois la page
// paginée et espacée, après MathJax le cas échéant.
window.__pagesReady = new Promise((resolve) => {
  window.__pagesReadyResolve = resolve;
});

function createPage(parent) {
  var page = document.createElement('div');
  page.className = 'pages--page';
  
  parent.appendChild(page)

  return page;
}

function elOverflow(parent, child) {
  // Save state
  const originalOverflow = parent.style.overflow;

  // For using scrollHeight
  parent.style.overflow = 'hidden';

  child = child.cloneNode(true)
  parent.appendChild(child);

  const overflow = parent.clientHeight - parent.scrollHeight;
  
  // restore
  parent.removeChild(child);
  parent.style.overflow = originalOverflow;

  return overflow
}

// Does a set of elements fit on a fresh, empty page? Fallback for
// keep-with-next: if the tied run + the overflowing element can't fit together
// on a new page, there is no solution and we break anyway (avoid is a hint).
function fitsOnEmptyPage(elements) {
  const page = createPage(document.body);
  page.style.overflow = 'hidden';
  elements.forEach(el => page.appendChild(el.cloneNode(true)));
  const fits = page.clientHeight - page.scrollHeight >= 0;
  document.body.removeChild(page);
  return fits;
}

// Read a break property. Inline style is reliable even on detached elements
// (the $newpage marker); computed style covers stylesheet rules.
function breakValue(el, prop) {
  return el.style[prop] || getComputedStyle(el)[prop];
}

// Is a break forbidden between a and b? Yes when a has break-after: avoid or b
// has break-before: avoid (keep-with-next / keep-with-previous).
function isTied(a, b) {
  return breakValue(a, 'breakAfter') === 'avoid' || breakValue(b, 'breakBefore') === 'avoid';
}

// Maximal trailing run of dest's children that must stay with `next`: every
// consecutive pair (including the boundary with `next`) is tied.
function avoidRun(dest, next) {
  const children = Array.from(dest.children);
  const run = [];
  for (let i = children.length - 1; i >= 0; i--) {
    const a = children[i];
    const b = (i === children.length - 1) ? next : children[i + 1];
    if (isTied(a, b)) {
      run.unshift(a);
    } else {
      break;
    }
  }
  return run;
}

function insertElements(source, dest) {
  while (source.firstChild) {
    const el = source.firstChild;

    // break-before: page — start a new page.
    if (breakValue(el, 'breakBefore') === 'page') {
      // Only break if the current page already has content; otherwise we're at
      // a page start and returning would loop forever on an empty page.
      if (dest.childElementCount > 0) {
        return;
      }
      // At a page start, a pure marker (empty div, e.g. $newpage) is dropped;
      // real content falls through and is placed below.
      if (el.childElementCount === 0 && el.textContent.trim() === '') {
        source.removeChild(el);
        continue;
      }
    }

    if (elOverflow(dest, el) < 0 && dest.childElementCount > 0) {
      // Keep-with-next: if the trailing elements are tied to el, move them to
      // the next page so they stay with el — unless they can't fit together on
      // a fresh page (no solution → break here anyway).
      const run = avoidRun(dest, el);
      if (run.length > 0 && fitsOnEmptyPage(run.concat([el]))) {
        // Insert before a stable reference: source.firstChild changes on each
        // insert, which would reverse the run.
        const first = source.firstChild;
        run.forEach(n => source.insertBefore(n, first));
      }
      return;
    }

    dest.appendChild(el);

    // break-after: page — break after this element.
    if (breakValue(el, 'breakAfter') === 'page') {
      return;
    }
  }
}

function makePages() {
  if (document.body.querySelector('.pages--page')) return;
  
  const body = document.body.cloneNode(true);
  document.body.innerHTML = ''

  Array.from(body.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      var wrapper = document.createElement('div');
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
    }
  });

  while (body.firstChild) {
    var currentPage = createPage(document.body)
    insertElements(body, currentPage)
  }
}

// Wrap runs of inline content in <p> within each flow container (body and
// .pages--to-flow elements), recursing into nested flow containers. Block
// elements break the paragraph; .pages--flow--par is a paragraph break and is
// dropped. .pages--as-inline elements are treated as inline (part of the
// paragraph) even if they render as block. Runs before pagination so pages are
// built from proper blocks.
function autoParagraph(container) {
  const fragment = document.createDocumentFragment();
  let pending = [];

  const flush = () => {
    if (pending.length === 0) return;
    const p = document.createElement('p');
    pending.forEach(n => p.appendChild(n));
    fragment.appendChild(p);
    pending = [];
  };

  Array.from(container.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim() === '') {
        if (pending.length > 0) pending.push(node);
      } else {
        pending.push(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (getComputedStyle(node).display.startsWith('inline') || node.classList.contains('pages--as-inline')) {
        pending.push(node);
      } else {
        flush();
        if (node.classList.contains('pages--flow--par')) return;
        if (node.classList.contains('pages--to-flow')) autoParagraph(node);
        fragment.appendChild(node);
      }
    }
  });
  flush();
  container.replaceChildren(fragment);
}

document.addEventListener('DOMContentLoaded', function () {
  // Paragraphs are built before MathJax typesets, so a formula script (with
  // .pages--as-inline) is wrapped in its <p> before MathJax replaces it.
  autoParagraph(document.body);
  const finish = () => {
    makePages();
    window.__pagesReadyResolve();
  };
  if (window.MathJax && window.MathJax.startup && hasMath) {
    // Resolves once MathJax has finished typesetting; .catch paginates anyway
    // if MathJax fails (CDN down, render error).
    window.MathJax.startup.promise.then(finish).catch(finish);
  } else {
    finish();
  }
});
