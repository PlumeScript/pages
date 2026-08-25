/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

window.MathJax = {
  loader: { load: ['input/asciimath'] },
  tex: {
    inlineMath: [],
    displayMath: [],
    numberPattern: localeConfig=="fr" && /^(?:[0-9]+(?:,[0-9]*)?|,[0-9]+)/ || /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)/
  },
  asciimath: { delimiters: [] },

  startup: {
    ready() {
      // The legacy AsciiMath jax ignores the MathItem display flag and wraps
      // its output in an <mstyle> that breaks display layout. This patch
      // unwraps the <mstyle> and honors math.display.
      // Deliberately differs from the official doc example, which recomputes
      // display from start.delim — that is '' here and would erase the flag
      // set by findScript below.
      // HACK: relies on legacy internal output structure, re-test on MathJax upgrade.
      const {AsciiMath} = MathJax._.input.asciimath_ts;
      Object.assign(AsciiMath.prototype, {
        _compile: AsciiMath.prototype.compile,
        compile(math, document) {
          const result = this._compile(math, document);
          const mstyle = result.childNodes[0].childNodes.pop();
          mstyle.childNodes.forEach(child => result.appendChild(child));
          if (math.display) {
            result.attributes.set('display', 'block');
          }
          return result;
        }
      });
      MathJax.startup.defaultReady();
    }
  },
  options: {
    renderActions: {
      // delimiter search; priority 10 = same slot as find.
      // Trailing '' = document-level action only, nothing on per-item rerender.
      findScript: [10, function (doc) {
        const tex = doc.inputJax.find(j => j.name === 'TeX');
        const am  = doc.inputJax.find(j => j.name === 'AsciiMath');
        for (const node of document.querySelectorAll('script[type^="math/"]')) {
          const jax = /ascii/.test(node.type) ? am : tex;
          if (!jax) continue; // requested math/<format> whose input jax is not loaded
          const display = !!node.type.match(/; *mode=display/);
          const math = new doc.options.MathItem(node.textContent, jax, display);
          const text = document.createTextNode('');
          node.parentNode.replaceChild(text, node);
          math.start = {node: text, delim: '', n: 0};
          math.end   = {node: text, delim: '', n: 0};
          doc.math.push(math);
        }
      }, '']
    }
  }
}
