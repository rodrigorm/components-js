Com = {};

function bind(name, source) {
  return Com[name] = Class(copy(copy({}, Component.prototype), source));
};

function load(element) {
  var last;
  
  function visit(element, parent) {
    var o, com, all = [], unknowns = {};
  
    if (element.className)
      all = element.className.split(' ');
    if (element.id)
      all.unshift(element.id);
  
    for (var name, i = 0; i < all.length; i++) {
      name = all[i];
    
      if (Com[name])
        com = com || (last = new Com[name](name, element, unknowns, last, parent));
      else
        unknowns[name] = true;
    }
    
    if (parent && com)
      parent[com.name] = parent[com.name] || com;
    
    o = com || parent;
    
    if (o)
      for (var name in unknowns)
        o[name] = o[name] || (com ? true : element);
    
    if (com && com.name == element.id)
      switch (com.name) {
        case 'content':  content  = com; break;
        case 'template': template = com;
      }
    
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