Component = Class({
  
  initialize: function(name, element, flags, prev, parent) {
    this.name    = name;
    this.element = element;
    this.flags   = flags;
    
    if (prev) {
      this._prev = prev;
      prev._next = this;
    }
    
    if (parent)
      this.parent = this[parent.name] = parent;
  },
  
  clone: function(deep) {
    return load(this.element.cloneNode(deep))[0];
  },
    
  apply: function(name) {
    this.flags[name] = true;
    this.updateNames();
  },
  
  clear: function(name) {
    this.flags[name] = false;
    this.updateNames();
  },
  
  updateNames: function() {
    var parts = [];
        
    for (var name in this.flags)
      if (this.flags[name])
        parts.push(name);
    
    if (this.name != this.element.id)
      parts.push(this.name);
    
    this.element.className = parts.join(' ');    
  },
  
  update: function(data, attributes) {
    if (typeof data == 'string') {
      // this.empty();
      // text(this.element).data = data;
      this.element.innerHTML = data;
    } else {
      var control;
      
      for (var name in data) {
        control = this[name];
        
        if (control.update)
          control.update(data[name]);
        else
          text(control).data = data;
      }
    }
    
    // Get/create the single non-empty text descendent
    function text(element) {
      var target;
      
      if (!element.firstChild)
        target = element;
      else
        for (var i = 0, nodes = element.childNodes; i < nodes.length; i++)
          if (nodes[i].nodeType == 1 || /\w/.test(nodes[i].data))
            if (target)
              return;
            else
              target = nodes[i];

      if (target && target.nodeType == 1)
        target = target.appendChild(document.createTextNode(''));
    }
  },
  
  append: function() {},
  
  insert: function() {},
  
  remove: function() {},
  
  chop: function(ref, name) {
    var com = this.parent.insert(spawn(name || this.name), this.next(null, true));
    
    var next, item = ref;
    
    do {
      next = this.next(null, true);
      com.append(item);
      item = next;
    } while (item);
    
    return com;
  },
  
  attach: function(prev, parent, next) {
    var i = this, j = this.last() || this;
    
    if (i._prev = prev) prev._next = i;
    if (j._next = next) next._prev = j;
    
    if (this.parent = parent) {
      this[parent.name] = parent;
      
      if (this.next(this.name) == parent[this.name])
        parent[this.name] = this;
    }
  },
  
  detach: function() {
    if (this.parent) {
      if (this.parent[this.name] == this)
        this.parent[this.name] = this.seek('next', this.name, true);
      
      this.parent[name] = null;
      this.parent       = null;
    }
    
    var i = this, j = this.last() || this;
    
    if (i._prev) i._prev._next = j._next;
    if (j._next) j._next._prev = i._prev;
  },
    
  first: function(matcher) {
    return this.seek('next', matcher, { subtree: true });
  },
  
  last: function(matcher) {
    var com;
    
    this.first(function() {
      if (this.match(matcher))
        com = this;
    });
    
    return com;
  },
  
  prev: function(matcher, sibling) {
    return this.seek('prev', matcher, { sibling: sibling });
  },
  
  next: function(matcher, sibling) {
    return this.seek('next', matcher, { sibling: sibling });
  },
    
  seek: function(id, matcher, options) {
    id = '_' + id;
    
    var com = this;
        
    while (com = com[id]) {
      if (options.subtree && !this.contains(com))
        return;
      if (options.sibling && this.parent && !this.parent.contains(com))
        return;
      if (com.match(matcher) && (!options.sibling || com.parent == this.parent))
        return com;
    }
  },
  
  contains: function(com) {
    while (com = com.parent)
      if (com == this) return true;
    return false;
  },
  
  match: function(matcher) {
    return matcher ?
      (typeof matcher == 'string' ?
        this.name == matcher : !!matcher.apply(this)) : true;
  },
     
  toHTML: function() {
    return this.element.innerHTML;
  },
    
  toString: function() {
    return this.element.id || this.element.className;
  }
});