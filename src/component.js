Component = Class({
    
  initialize: function(name, element, flags, prev, parent) {
    this.name    = name;
    this.element = element;
    this.flags   = flags;
    
    this.createListeners('element');
    
    for (var flag in flags) this[flag] = this[flag] || true;
    
    if (prev) {
      this._prev = prev;
      prev._next = this;
    }
    
    if (parent)
      this.parent = this[parent.name] = parent;
  },
  
  handle: function(event) {
    var callback, result, target = event.target, names = Com[this.name].Named;

    do {
      for (var name in names)
        if (this[name] == target && (callback = names[name][event.type]))
          if (this[callback](event) === false)
            result = false;      
    } while (target = target.parentNode);
    
    return result;
  },
  
  exec: function(cmd, value) {
    var name = 'on';
    
    if (typeof cmd == 'string')
      cmd = [cmd];

    for (var i = 0; i < cmd.length; i++)
      name += cmd[i].charAt(0).toUpperCase() + cmd[i].substring(1)

    if (this[name])
      return this[name](value);
  },
    
  start: function(callback, period) {
    var com = this, id = setInterval(function() {
      if (callback.apply(com) === false)
        clearInterval(id);
    }, period);
  },
  
  select: function(com) {
    if (this.selected != com) {
      if (typeof this.selected == 'object')
        this.selected.clear('selected');

      if (this.selected = com)
        this.selected.apply('selected');
    }
    return com;
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
      this.empty();
      text(this.element).data = data;
    } else {
      var control, text;
      
      for (var name in data) {
        if (control = this[name])        
          if (control.update)
            control.update(data[name]);
          else if (text = text(control))
            text.data = data[name];
      }
    }
    
    // Get/create the single non-blank text descendent
    function text(element) {
      var nodes = element.childNodes;

      if (!nodes[1]) {
        if (nodes[0]) {
          if (nodes[0].nodeType == 1)
            return text(nodes[0]);
          else if (nodes[0].nodeType == 3)
            return nodes[0];
        } else {
          return element.appendChild(document.createTextNode(''));
        }
      } else {
        var candidate;
        for (var i = 0; i < nodes.length; i++)
          if (nodes[i].nodeType == 3) {
            if (/\w/.test(nodes[i].data))
              return;
          } else if (nodes[i].nodeType == 1) {
            if (candidate)
              return;
            candidate = nodes[i];
          }
        return text(candidate);
      }
    }
  },
  
  chop: function(start, name, data) {
    var com = this.parent.insert(name || this.name, data, this.next(null, true));
    
    var next, item = start;
    
    do {
      next = item.next(null, true);
      item.move(com);
      item = next;
    } while (item);
    
    return com;
  },
  
  append: function(name, data) {
    return this.insert(name, data);
  },
  
  insert: function(name, data, next) {
    return Com.template.spawn(name, data).move(this, next);
  },
  
  move: function(parent, next) {
    if (next)
      parent.element.insertBefore(this.element, next.element);
    else
      parent.element.appendChild(this.element);

    this.detach();
    next = next || (parent.last() || parent)._next;
    this.attach(next ? next._prev : parent, parent, next);
        
    return this;
  },
    
  remove: function() {
    this.detach();
    this.element.parentNode.removeChild(this.element);
    return this;
  },
  
  empty: function() {
    var com = this;
    while ((com = this._next) && this.contains(com)) com.detach();
    this.element.innerHTML = '';
  },
  
  attach: function(prev, parent, next) {
    var i = this, j = this.last() || this;
    
    if (i._prev = prev) prev._next = i;
    if (j._next = next) next._prev = j;

    if (this.parent = parent) {
      this[parent.name] = parent;

      if (!parent[this.name] || this.next(this.name) == parent[this.name])
        parent[this.name] = this;
    }
  },
  
  detach: function() {
    if (this.parent) {
      if (this.parent[this.name] == this)
        this.parent[this.name] = this.next(this.name, true);
      
      this.parent[name] = null;
      this.parent       = null;
    }
    
    var i = this, j = this.last() || this;
    
    if (i._prev) i._prev._next = j._next;
    if (j._next) j._next._prev = i._prev;
  },
    
  first: function(matcher) {
    return this.each(matcher, function() { return this });
  },
  
  last: function(matcher) {
    var com;
    this.each(matcher, function() { com = this });
    return com;
  },
  
  collect: function(matcher) {
    var collection = [];
    this.each(matcher, function() { collection.push(this) });
    return collection;
  },
  
  each: function() {
    var matcher  = arguments[arguments.length - 2];
    var callback = arguments[arguments.length - 1];
    
    var result, com = this;
    while ((com = com._next) && this.contains(com))
      if (com.match(matcher) && (result = callback.apply(com)))
        return result;
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
      if (options.sibling && this.parent && !this.parent.contains(com))
        return;
      if ((!options.sibling || com.parent == this.parent) && com.match(matcher))
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
  
  createListeners: function(name) {
    var com = this;
    for (var event in Com[this.name].Named[name] || {})
      this[name]['on' + event] = function(event) {
        return com.handle(event || window.event);
      }
  },
  
  toHTML: function() {
    return this.element.innerHTML;
  },
    
  toString: function() {
    return this.element.id || this.element.className;
  }
});