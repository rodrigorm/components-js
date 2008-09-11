var Tree = Class.create({
  
  initialize: function(bindings) {
    this.bindings = bindings || {};
  },
  
  bind: function(name, source) {
    this.bindings[name] = Component.extend(source);
  },
  
  load: function(element) {
    var container, c, first, last, tree = this;
    
    function add(container) {
      link(last, container);
      first = first || container;
      return last = container;
    };
    
    function link(i, j) {
      if (i) {
        i.next = j;
        j.prev = i;
      }
      return j;
    };
    
    function visit(element, parent) {
      var container, components = {}, flags = {}, all = [], names = [];
      
      if (element.className)
        all = element.className.split(' ');
      if (element.id)
        all.unshift(element.id);

      names._h = {}; // keep a hash for easy lookup in future

      for (var name, i = 0; i < all.length; i++) {
        name = all[i];
        
        if (!names._h[name]) { // filter out duplicates
          if (name != element.id) {
            names.push(name);
            names._h[name] = true;
          }
          
          if (tree.bindings[name]) {
            container = container || add(new Container(tree, element, names, components, parent));
            components[name] = new tree.bindings[name](container, name);
          } else if (name != element.id) { // class with no definition - it's a flag
            flags[name] = true;
          }
          
          if (parent) // make child references
            parent.objects[name] || parent.set(name, components[name] || element);
        }
      }

      for (var flag in flags)
        for (var name in components)
          components[name][flag] = components[name][flag] || true;

      for (var i = 0, node; i < element.childNodes.length; i++) // visit the subtree
        if ((node = element.childNodes[i]).nodeType == 1)
          visit(node, container || parent);

      if (parent && container)  // make parent references
        for (var name in parent.components)
          container.objects[name] || container.set(name, parent.components[name]);     
      
      return container; 
    }
        
    container = visit(element);
    
    if (c = first)
      do
        c.run();
      while ((c = c.next) && (c != last.next));    
    
    return container;
  }
});

var Container = Class.create({

  initialize: function(tree, element, names, components, container) {
    this.tree       = tree;
    this.element    = element;
    this.names      = names;
    this.components = components;
    this.container  = container;
    this.objects    = {};
  },
    
  run: function() {
    var c;
    for (var name in this.components) {
      c = this.components[name];
      if (c.run)
        c.run();
      c.createAllListeners();
    }
  },
  
  clone: function(deep) {
    return this.tree.load(this.element.cloneNode(deep));
  },
      
  empty: function() {
    var next = (this._last() || this).next;
    while (this.next != next) this.next.detach();
    this.element.innerHTML = '';
  },
    
  setTag: function(name) {
    var element = document.createElement(name);
    
    element.className = this.element.className;
    
    while (this.element.firstChild)
      element.appendChild(this.element.firstChild);
    
    this.element.parentNode.replaceChild(element, this.element);
    
    for (var name in this.components)
      this.components[name].element = element;
    
    this.element = element;
    
    return this;
  },
    
  replace: function(component) {
    component = this.container.insert(component, this);
    this.remove();
    return component;
  },
  
  build: function(name, data, next) {
    var com;
    
    if (com = this.components[name] || this.seek(name, 'prev') || this.seek(name, 'next'))
      return this.insert(com.clone(true).update(data || ''), next);
    else
      throw new Error('No instances for ' + name);
  },
  
  append: function(component) {
    return this.insert(component, null);
  },
     
  insert: function(o, next) {
    var c, prev, com;
        
    if (o.name) {
      com = o;
      com.container.detach();
    } else if (typeof o == 'string') {
      if (c = this.tree.load(build(o)))
        com = (function() { for (var name in c.components) return c.components[name] })();
      else
        throw new Error('No top-level components yielded: ' + o);
    }
    
    if (next)
      this.element.insertBefore(com.element, next.element);
    else
      this.element.appendChild(com.element);
    
    if (next && next.name)
      next = next.container;

    next = next || (this._last() || this).next;
        
    com.container.attach(next ? next.prev : this, this, next);
    return com;
  },
  
  detach: function() {
    var com, i = this, j = this._last() || this;
    
    if (i.prev) i.prev.next = j.next;
    if (j.next) j.next.prev = i.prev;
    
    if (this.container) {
      // Remove parent references:
      for (var name in this.objects)
        if (this.objects[name].element == this.container.element)
          this.unset(name);
      
      // Remove/update our parents references to our components:
      for (var name in this.container.objects)
        if (this.container.objects[name].element == this.element)
          if (com = this.components[name].next(true))
            this.container.set(name, com, true);
          else
            this.container.unset(name);
    }
  },
  
  attach: function(prev, container, next) {
    var i = this, j = this._last() || this;
    
    if (i.prev = prev) prev.next = i;
    if (j.next = next) next.prev = j;
    
    if (this.container = container) {
      // New child references:
      for (var name in this.components)
        if (!this.components[name].prev(true))
          container.set(name, this.components[name], true);
      
      // New parent references:
      for (var name in container.components)
        this.objects[name] || this.set(name, container.components[name], true);
    }
  },
      
  addName: function(name) {
    if (!this.names._h[name]) {
      this.names.unshift(name);
      this.names._h[name] = true;
      this.element.className = this.names.join(' ');
    }
    return this.names;
  },
  
  removeName: function(name) {
    if (this.names._h[name])
      for (var i = 0; i < this.names.length; i++)
        if (this.names[i] == name) {
          this.names.splice(i, 1);
          this.names._h[name] = false;
          return this.element.className = this.names.join(' ');
        }
    return this.names;
  },

  remove: function() {
    this.detach();
    this.element.parentNode.removeChild(this.element);
    return this;
  },
  
  set: function(id, object, listeners) {
    var c;
    
    for (var name in this.components) {
      c = this.components[name];
      
      if (!c[id] || (c[id].nodeType == 1) || c[id].name) {
        c[id] = object;
        this.objects[id] = object;
        
        if (listeners)
          c.createListeners(id);
      }
    }
    this.objects[id];
  },
    
  unset: function(id) {
    for (var name in this.components)
      delete(this.components[name][id]);

    delete(this.objects[id]);
  },
  
  first: function(name) {
    return this.each(function() { return this.components[name] });
  },
  
  last: function(name) {
    var last;
    this.each(function() { last = this.components[name] || last });
    return last;
  },
      
  collect: function(name) {
    var list = [];
    this.each(function() { if (this.components[name]) list.push(this.components[name]) });
    return list;
  },
   
  each: function(iterator) {
    var result, c = this;
    while ((c = c.next) && this.contains(c) && !(result = iterator.apply(c)));
    return result;
  },
    
  contains: function(c) {
    while (c = c.container)
      if (c == this) return true;
    return false;
  },
   
  seek: function(name, id, horizontal) {
    var com, c = this;    

    while ((c = c[id]) && (!horizontal || !this.container || this.container.contains(c)))
      if (!horizontal || c.container == this.container)
        if (com = c.components[name])
          return com;
  },
  
  find: function(node) {
    var c = this;
    
    function visit(n) {
      if (c.next)
        if (c.next.element == n)
          c = c.next;
      
      if (node == n)
        return c.element == n ?
          { prev: c.prev, container: c, next: c.next } :
          { prev: c, next: c.next };
      
      for (var o, i = 0; i < n.childNodes.length; i++)
        if (o = visit(n.childNodes[i]))
          return o;
    }
    return visit(this.element);
  },
  
  _last: function() {
    var last;
    this.each(function() { last = this });
    return last;
  }
});