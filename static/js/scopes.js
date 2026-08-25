/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

(function () {
  'use strict';

  const FLOW_PAR_CLASS = 'pages--flow--par';

  function makeScopes(elem) {
    if (!elem || typeof elem.querySelectorAll !== 'function') return;

    const markers = Array.from(elem.querySelectorAll('.pages--scope-begin, .pages--scope-end'));
    const openByScope = new Map();
    const pairs = [];
    for (const marker of markers) {
      const id = (marker.getAttribute('data-scope') || '').trim();
      if (!id) continue;
      if (marker.classList.contains('pages--scope-begin')) {
        const stack = openByScope.get(id);
        if (stack) stack.push(marker);
        else openByScope.set(id, [marker]);
      } else {
        const stack = openByScope.get(id);
        const begin = stack ? stack.pop() : null;
        if (begin) pairs.push({ id, begin, end: marker });
      }
    }

    for (const { id, begin, end } of pairs) {
      const scopeClass = 'pages--scope-' + id;
      for (const node of topContentNodes(begin, end)) {
        if (node.nodeType === Node.TEXT_NODE) {
          wrapInSpan(node).classList.add(scopeClass);
        } else if (!node.classList.contains(FLOW_PAR_CLASS)) {
          markElements(node, scopeClass);
        }
      }
    }

    for (const marker of markers) {
      marker.classList.remove('pages--scope-begin');
      marker.classList.remove('pages--scope-end');
      if (marker.className.split(/\s+/).some((c) => c.startsWith('pages--scope-'))) {
        marker.removeAttribute('data-scope');
      } else if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    }
  }

  function topContentNodes(begin, end) {
    const nodes = [];
    if (begin.contains(end)) return nodes;

    let level = begin.parentElement;
    if (!level) return nodes;
    let startIndex = indexOfChild(level, begin) + 1;

    for (;;) {
      const children = level.childNodes;
      let descended = false;
      for (let i = startIndex; i < children.length; i++) {
        const child = children[i];
        if (child === end) return nodes;
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.contains(end)) {
            level = child;
            startIndex = 0;
            descended = true;
            break;
          }
          if (!child.classList.contains(FLOW_PAR_CLASS)) nodes.push(child);
        } else if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== '') {
          nodes.push(child);
        }
      }
      if (descended) continue;
      const parent = level.parentElement;
      if (!parent) return nodes;
      startIndex = indexOfChild(parent, level) + 1;
      level = parent;
    }
  }

  function markElements(element, scopeClass) {
    element.classList.add(scopeClass);
    for (const child of element.children) {
      if (child.classList.contains(FLOW_PAR_CLASS)) continue;
      markElements(child, scopeClass);
    }
  }

  function wrapInSpan(textNode) {
    const span = document.createElement('span');
    textNode.parentNode.insertBefore(span, textNode);
    span.appendChild(textNode);
    return span;
  }

  function indexOfChild(parent, child) {
    const children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
      if (children[i] === child) return i;
    }
    return -1;
  }

  if (typeof window !== 'undefined') {
    window.makeScopes = makeScopes;
  }
})();
