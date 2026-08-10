/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

// Captured during parsing, before MathJax (defer) consumes the math scripts.
const hasMath = !!document.querySelector('script[type^="math/"]');

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
  if (window.MathJax && window.MathJax.startup && hasMath) {
    // Resolves once MathJax has finished typesetting; .catch paginates anyway
    // if MathJax fails (CDN down, render error).
    window.MathJax.startup.promise.then(() => { makePages(); addSpacing(); })
      .catch(() => { makePages(); addSpacing(); });
  } else {
    makePages();
    addSpacing();
  }
});
