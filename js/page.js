/*
This file is part of Pages - A Plume🪶 document generator

Copyright © Erwan Barbedor
Licensed under the MIT License — see LICENSE for details.
*/

function createPage(parent) {
  var page = document.createElement('div');
  page.className = 'page';
  
  parent.appendChild(page)

  return page;
}

function elOverflow(parent, child) {
  child = child.cloneNode(true)
  // Save state
  const originalOverflow = parent.style.overflow;

  // For using scrollHeight
  parent.style.overflow = 'hidden';

  parent.appendChild(child);

  const overflow = parent.scrollHeight > parent.clientHeight;
  
  // restore
  parent.removeChild(child);
  parent.style.overflow = originalOverflow;

  return overflow
}

function insertElements(source, dest) {
  while (source.firstChild) {
    if (elOverflow(dest, source.firstChild) && dest.childElementCount > 0) {
      return;
    }
    dest.appendChild(source.firstChild);
  }
}

document.addEventListener('DOMContentLoaded', function () {
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
});
