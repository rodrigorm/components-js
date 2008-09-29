Com = {};

Listener = /^on(abort|beforeunload|blur|change|click|dblclick|error|focus|keydown|keypress|keyup|load|mousedown|mousemove|mouseout|mouseover|mouseup|reset|resize|select|submit|unload)(\w*)$/i;

function bind(name, source) {
  Com[name] = Class(copy(copy({}, Component.prototype), source));
  
  Com[name].Named = {};
  
  var data, event, target;
  
  for (var id in source)
    if (data = id.match(Listener)) {
      event  = data[1].toLowerCase();
      target = data[2] ? data[2].charAt(0).toLowerCase() + data[2].substring(1) : 'element';

      Com[name].Named[target] = Com[name].Named[target] || {};
      Com[name].Named[target][event] = id;
    }

  return Com[name];
};

function load(element) {
  var last;
  
  function visit(element, parent) {
    var com, all = [], unknowns = {};
  
    if (element.className)
      all = element.className.split(' ');
    if (element.id)
      all.unshift(element.id);
  
    for (var name, i = 0; i < all.length; i++) {
      name = all[i];
    
      if (Com[name] && !com)
        com = last = new Com[name](name, element, unknowns, last, parent);
      else
        unknowns[name] = true;      
    }
    
    if (parent)
      if (com)
        parent[com.name] = parent[com.name] || com;
      else
        for (var name in unknowns)
          if (!parent[name]) {
            parent[name] = element;
            parent.createListeners(name);
          }
    
    
    if (com && com.name == element.id)
      Com[name] = com;
    
    for (var i = 0, nodes = element.childNodes; i < nodes.length; i++)
      if (nodes[i].nodeType == 1)
        visit(nodes[i], com || parent);
    
    return com;
  };
  
  return visit(element);
};

function Class(source) {
  function klass() {
    if (this.initialize)
      this.initialize.apply(this, arguments);
  };

  if (source)
    copy(klass.prototype, source);

  return klass;
};

function copy(destination, source) {
  source = source || {};
  
  for (var id in source)
    destination[id] = source[id];

  if (source.toString != Object.prototype.toString) // Force IE to override toString
    destination.toString = source.toString;

  return destination;
}