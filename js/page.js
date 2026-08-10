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
  page.className = 'page';
  
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

function insertElements(source, dest) {
  while (source.firstChild) {
    if (source.firstChild.classList.contains('pages--flow--newpage')) {
      dest.appendChild(source.firstChild);
      return
    }

    if ((elOverflow(dest, source.firstChild) < 0 && dest.childElementCount > 0)) {
      return;
    }
    dest.appendChild(source.firstChild);
  }
}

function makePages() {
  if (document.body.querySelector('.page')) return;
  
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

// Second pass, after pagination: insert a bounded vspace after each
// .pages--to-space element and as the last element of every page, so the
// leftover vertical space is absorbed (up to --vspace-max).
function addSpacing() {
  const makeVspace = () => {
    const el = document.createElement('div');
    el.className = 'pages--flow--vspace';
    return el;
  };

  document.querySelectorAll('.page').forEach(page => {
    page.querySelectorAll('.pages--to-space').forEach(el => {
      el.insertAdjacentElement('afterend', makeVspace());
    });
    page.appendChild(makeVspace());
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Paragraphs are built before MathJax typesets, so a formula script (with
  // .pages--as-inline) is wrapped in its <p> before MathJax replaces it.
  autoParagraph(document.body);
  const finish = () => {
    makePages();
    addSpacing();
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
