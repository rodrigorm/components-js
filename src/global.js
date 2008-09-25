Com = {};

function bind(name, source) {
  Com[name] = Class(copy(copy(Component.prototype), source));
};

function load(element) {
  var last, top = [];
  
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
        parent[com.name] = com;
      else
        for (var name in unknowns)
          parent[name] = parent[name] || element;
    
    
    if (com && com.name == element.id)
      top.push(com);
    
    for (var i = 0, nodes = element.childNodes; i < nodes.length; i++)
      if (nodes[i].nodeType == 1)
        visit(nodes[i], com || parent);
    
    return com;
  };
  
  return [visit(element), top];
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