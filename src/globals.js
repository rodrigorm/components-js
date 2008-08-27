var bindings = {};
  
function bind(name, source) {
  return bindings[name] = Component.extend(source);
};

function register(callback) {
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
  } else if (document.uniqueID && document.expando) { // http://www.hedgerwow.com/360/dhtml/ie-dom-ondocumentready.html
    var element = document.createElement('span'); 
    
    (function () { 
      if (document.loaded) return;

      try {
        element.doScroll('left');
        
        if (!document.body)
          throw new Error();
        
        document.loaded = true;
        callback();
        element = null; 
      } catch(e) {
        setTimeout(arguments.callee, 0); 
      } 
    })();
  }
};
  
function load(object) {
  if (typeof object == 'string')
    object = build(object);
  
  var tree = new Tree(object);
  
  if (tree.i && tree.i.element == object)
    for (var name in tree.i.components)
      return tree.i.components[name];
  
  return object;
};
    
function build(text) {
  var element, name = (text.match(/<(\w+)\/?[\s|>]/i) || [])[1];

  if (name) {
    name    = name.toLowerCase();
    element = document.createElement('div');
    text    = text.slice(text.indexOf('<'));

    var depth = 1;
    while (name = build.Tags[name]) {
      text = tag(name, null, text);
      depth++;
    }
    
    element.innerHTML = text;

    for (var i = 0; i < depth; i++)
      element = element.firstChild;
    
    element.parentNode.removeChild(element);
  }
  return element;
};

build.Tags = {
  li:    'ul',
  td:    'tr',
  tr:    'tbody',
  tbody: 'table'
};

register(function() {
  load(document.body);
});