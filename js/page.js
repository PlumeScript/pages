function createPage() {
  var page = document.createElement('div');
  page.className = 'page';
  
  return page;
}

function checkPageOverflow(parent, child) {

}

function insertElements(source, dest) {
  while (source.firstChild) {
    checkPageOverflow(currentPage, body.firstChild)
    dest.appendChild(source.firstChild);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const body = document.body;
  
  Array.from(body.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      var wrapper = document.createElement('div');
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
    }
  });

  var currentPage = createPage()
  insertElements(body, currentPage)
  body.appendChild(currentPage)
  
});
