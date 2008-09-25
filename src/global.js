Com = {};

function bind(name, source) {
  Com[name] = Class(copy(copy(Component.prototype), source));
};

function load(element) {
  var last, top = [];
  
  function visit(element, parent) {
    var com, flags = {}, all = [];
  
    if (element.className)
      all = element.className.split(' ');
    if (element.id)
      all.unshift(element.id);
  
    for (var name, i = 0; i < all.length; i++) {
      name = all[i];
    
      if (Com[name] && !com)
        com = new Com[name](name, element, flags, parent);
      else
        flags[name] = true;
      
      // if (parent && !parent[name])
      //   parent[name] = ;
    }
    
    if (com) {
      if (com.name == element.id)
        top.push(com);

      if (last) {
        last.next = com;
        com.prev  = last;
      }
      last = com;      
    }
    
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