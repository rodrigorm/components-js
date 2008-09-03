var Tree = Class.create({
  
  initialize: function(element, container) {
    this.load(element, container);
    this.invoke('run');
  },
  
  load: function(element, parent) {
    var container, components = {}, list = [];
    
    if (element.className)
      list = element.className.split(' ');
    if (element.id)
      list.unshift(element.id);
    
    for (var i = 0, id, ids = []; i < list.length; i++) {
      id = list[i];
      
      if (!ids[id]) {
        ids[id] = true;
        
        if (id != element.id)
          ids.push(id);
        
        if (bindings[id]) {
          container = container || this.push(new Container(element, ids, components, parent));
          components[id] = new bindings[id](container, id);
        }
        if (parent) {
          parent.objects[id] || parent.set(id, components[id] || element);
        }
      }
    }
    
    for (var i = 0, node; i < element.childNodes.length; i++) {
      node = element.childNodes[i];
      
      if (node.nodeType == 1)
        this.load(node, container || parent);
    }
    
    if (parent && container)
      for (var name in parent.components)
        container.objects[name] || container.set(name, parent.components[name]);
  },
  
  push: function(item) {
    if (this.j) {
      item.prev   = this.j;
      this.j.next = item;
    }
    
    this.i = this.i || item;
    this.j = item;
    
    return item;
  },
      
  invoke: function(method) {
    var container;
    
    if (container = this.i)
      do
        container[method]();
      while ((container = container.next) && (container != this.j.next));    
  }
});

var Container = Class.create({

  initialize: function(element, names, components, container) {
    this.element    = element;
    this.container  = container;
    this.names      = names;
    this.components = components;
    this.objects    = {};
  },
    
  run: function() {
    var c;
    for (var name in this.components) {
      c = this.components[name];
      if (c.run)
        c.run();
      c.createListeners();
    }
  },
    
  update: function(object) {
    if (typeof object == 'string') {
      this.empty();
      return this.element.appendChild(document.createTextNode(object));
    } else {
      for (var name in object)
        if (this.objects[name] && this.objects[name].nodeType == 1) {
          this.objects[name].innerHTML = '';
          this.objects[name].appendChild(document.createTextNode(object[name]));
        }
    }
  },
  
  empty: function() {
    var next = (this._last() || this).next;
    while (this.next != next) this.next.move();
    this.element.innerHTML = '';
  },
    
  setTag: function(name) {
    var element = document.createElement(name);
    
    while (this.element.firstChild)
      element.appendChild(this.element.firstChild);
    
    this.element.parentNode.replaceChild(element, this.element);
    
    return this.setElement(element);
  },
  
  setElement: function(element) {
    for (var name in this.components)
      this.components[name].element = element;
    return this.element = element;
  },
  
  append: function(component) {
    return this.insert(component, null);
  },
     
  insert: function(component, next) {
    if (typeof component == 'string')
      component = load(component);
    
    var prev, container = this, insert = component.container;
    
    if (next) {
      if (next.name)
        next = next.container;
      
      if (next != insert.next) {
        this.element.insertBefore(insert.element, next.element);
        insert.move(next.prev, this, next);
      }
    } else {
      this.element.appendChild(insert.element);
      
      prev = this._last() || this;
      
      if (prev != insert)
        insert.move(prev, this, prev.next == insert ? prev.next.next : prev.next);
    }

    return component;
  },
    
  move: function(prev, container, next) {
    if (this.container) {
      // Remove references to containing components:
      for (var name in this.objects) {
        if (this.objects[name].element == this.container.element)
          this.unset(name);
        }
      
      // Remove/update child references to these components:
      for (var name in this.container.objects) {
        if (this.container.objects[name].element == this.element) {
          this.container.unset(name);
          
          // If there is a later child with this name, move pointer to that:
          var c = this.seek(name, 'next');
          
          while (c && this.contains(c))
            c = c.next()

          if (c && this.container.contains(c))
            this.container.set(name, c);            
        }
      }
    }
    
    var i = this, j = this._last() || this;

    // Detach from list:
    if (i.prev) i.prev.next = j.next;
    if (j.next) j.next.prev = i.prev;
    
    // Re-attach in new position:
    if (i.prev = prev) prev.next = i;
    if (j.next = next) next.prev = j;
    
    if (this.container = container) {
      for (var name in this.components) {
        // Create/update reference if this is the new first instance of it's type:
        if (!container.objects[name] || (container.objects[name] != container.first(name))) {
          container.unset(name);
          container.set(name, this.components[name]);
        }
      }
      
      for (var name in container.components)
        this.objects[name] || this.set(name, container.components[name]);
    }
  },
  
  addName: function(name) {
    if (!this.hasName(name)) {
      this.names.unshift(name);
      this.element.className = this.names.join(' ');
    }
    return this.names;
  },
  
  removeName: function(name) {
    if (name == this.element.id)
      return;
    
    for (var i = 0; i < this.names.length; i++) {
      if (this.names[i] == name) {
        this.names.splice(i, i + 1);
        return this.element.className = this.names.join(' ');
      }
    }
    return this.element.className;
  },

  hasName: function(name) {
    for (var i = 0; i < this.names.length; i++)
      if (this.names[i] == name) return true;
    return false;
  },

  remove: function() {
    this.move();
    this.element.parentNode.removeChild(this.element);
  },
  
  set: function(id, object) {
    var c;
    
    for (var name in this.components) {
      c = this.components[name];
      
      if (!c[id] || (c[id].nodeType == 1) || c[id].name) {
        c[id] = object;
        this.objects[id] = object;
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
  
  contains: function(child) {
    var c = child;
    while (c = c.container)
      if (c == this) return true;
    return false;
  },
     
  seek: function(name, id, horizontal) {
    var component, c = this;    

    while ((c = c[id]) &&
          (!horizontal || c.container == this.container) &&
          !(component = c.components[name]));

    return component;
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