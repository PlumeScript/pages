/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

// No orphaned punctuation. The browser may break a line right before closing
// punctuation when a space (or a node boundary) separates it from the last
// word, stranding a lone ". ? ! ; : …" at the start of the next line. The
// break opportunity is that space: it is replaced with a no-break space so
// the last word and its punctuation move together. Punctuation glued to its
// word is already safe (no break is allowed before it), and code, formulas
// and header/footer zones are left untouched. Runs after autoParagraph (all
// flow text is in <p>) and before makePages so the overflow measurements see
// the final wrapping.

(function () {
  'use strict';

  const WS = ' \t\n\r\f\v';
  const CLOSING = new Set([
    '.', '!', '?', ';', ':', '\u2026',    // sentence end
    '\u201D', '\u0022', '\u2019', '\u0027',    // closing quotes
    '\u00BB', '\u203A',                   // closing guillemets
    ')', ']', '}'                         // closing brackets
  ]);
  const SKIP = 'pre, code, script, mjx-container, .pages--to-insert';

  function isWS(ch) {
    return WS.indexOf(ch) !== -1;
  }

  function isClosing(ch) {
    return CLOSING.has(ch);
  }

  // Rendered content ends right before the node? A leading whitespace run is
  // a break opportunity only when something non-space precedes it.
  function hasContentBefore(node) {
    const prev = node.previousSibling;
    if (!prev) return false;
    const text = prev.nodeType === Node.TEXT_NODE ? prev.nodeValue : prev.textContent;
    return (text || '').replace(/\s+$/, '').length > 0;
  }

  // The node opens with closing punctuation and the previous text node ends
  // with a whitespace run: the break opportunity sits in that tail, so the
  // tail is what must become unbreakable.
  function glueTailBefore(node) {
    const value = node.nodeValue;
    if (!value || !isClosing(value[0])) return;
    const prev = node.previousSibling;
    if (!prev || prev.nodeType !== Node.TEXT_NODE) return;
    const pv = prev.nodeValue;
    const trimmed = pv.replace(/\s+$/, '');
    if (trimmed.length === pv.length) return;
    prev.nodeValue = trimmed + '\u00A0';
  }

  // Glue every whitespace run of this node that is followed by closing
  // punctuation (a single no-break space stands in for the whole run).
  function processNode(node) {
    const v = node.nodeValue;
    let out = '';
    let i = 0;
    while (i < v.length) {
      if (!isWS(v[i])) {
        out += v[i];
        i += 1;
        continue;
      }
      let j = i;
      while (j < v.length && isWS(v[j])) j += 1;
      if (j < v.length && isClosing(v[j]) && (i > 0 || hasContentBefore(node))) {
        out += '\u00A0';
      } else {
        out += v.slice(i, j);
      }
      i = j;
    }
    if (out !== v) node.nodeValue = out;
  }

  function noOrphanPunct(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    Array.from(root.querySelectorAll('p')).forEach(par => {
      const nodes = [];
      const walker = document.createTreeWalker(par, NodeFilter.SHOW_TEXT, {
        acceptNode(text) {
          const el = text.parentElement;
          if (el && el.closest(SKIP)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let text;
      while ((text = walker.nextNode())) nodes.push(text);
      nodes.forEach(node => {
        glueTailBefore(node);
        processNode(node);
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.noOrphanPunct = noOrphanPunct;
  }
})();
