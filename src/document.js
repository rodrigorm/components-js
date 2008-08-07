extend(document, {
    
  bindings: {},
  
  bind: function(name, source) {
    return this.bindings[name] = Component.extend(source);
  },

  register: function(callback) {
    var userAgent = navigator.userAgent.toLowerCase();

    if (/webkit/.test(userAgent)) {
      var timeout = setTimeout(function() {
        if (document.readyState == 'loaded' || document.readyState == 'complete' ) {
          callback();
        } else {
          setTimeout(arguments.callee, 10);
        }
      }, 10); 
    } else if ((/mozilla/.test(userAgent) && !/(compatible)/.test(userAgent)) || (/opera/.test(userAgent))) {
      document.addEventListener('DOMContentLoaded', callback, false);
    } else if (document.uniqueID && document.expando) { // ie
      // http://www.hedgerwow.com/360/dhtml/ie-dom-ondocumentready.html
      var tempNode = document.createElement('document:ready'); 
      
      (function () { 
        if (document.loaded) return;

        try {
          tempNode.doScroll('left');
          
          if (!document.body)
            throw new Error();
          
          document.loaded = true;
          callback();
          tempNode = null; 
        } catch(e) {
          setTimeout(arguments.callee, 0); 
        } 
      })();
    }
  },
  
  load: function(element) {
    if (typeof element == 'string')
      element = this.build(element);
    
    var tree = new Tree(element);
    
    if (tree.i && tree.i.element == element)
      for (var name in tree.i.components)
        return tree.i.components[name];
    
    return element;
  },
    
  build: function(text) {
    var node = this.buildFragment(text).firstChild;

    do {
      if (node.nodeType == 1)
        return node.parentNode.removeChild(node);
    } while (node = node.nextSibling);
  },
  
  buildFragment: function(text) {
    var fragment = this.createDocumentFragment(), container = this.createElement('div');

    var containingTags = [];

    var matches = text.match(/^\s*<(li|td|tr|tbody)/i);

    if (matches)
      containingTags = Tags.containersFor(matches[1].toLowerCase());

    for (var i = 0; i < containingTags.length; i++) text = "<" + containingTags[i] + ">" + text + "</" + containingTags[i] + ">";
    container.innerHTML = text;
    for (var i = 0; i < containingTags.length; i++) container = container.firstChild;

    for (var i = container.childNodes.length - 1; i > -1; i--) fragment.insertBefore(container.childNodes[i], fragment.firstChild);

    if (!fragment.firstChild && text.length > 0)
      fragment.appendChild(this.createTextNode(text));

    return fragment;
  }
});

var Tags = {
  
  containersFor: function(tag) {
    tag = tag.toLowerCase();
    
    var containingTags = [], containingTag = Tags.containers[tag];
    if (containingTag) {
      containingTags = Tags.containersFor(containingTag);
      containingTags.unshift(containingTag);
    }
    return containingTags;
  },
  
  containers: {
    li:    'ul',
    td:    'tr',
    tr:    'tbody',
    tbody: 'table'
  }  
};

document.register(function() {
  document.load(document.body);
});