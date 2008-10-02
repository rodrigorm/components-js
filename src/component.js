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

    this.createMouseListeners(element);
  },
  
  handle: function(event) {
    var result, id = event.type, node = event.target;
    
    id = id.replace('up', 'Up').replace('down', 'Down');
    
    do {
      for (var name in this)
        if (this[name] == node)
          if (this.exec(name ==  'element' ? id : [id, name], event) === false)
            result = false;
    } while ((node = node.parentNode) != this.element.parentNode);
    
    return result;
  },
  
  exec: function(cmd) {
    var name = 'on', args = [];
    
    if (typeof cmd == 'string')
      cmd = [cmd];

    for (var i = 0; i < cmd.length; i++)
      name += cmd[i].charAt(0).toUpperCase() + cmd[i].substring(1);

    if (!this[name])
      return;

    for (var j = 1; j < arguments.length; j++)
      args.push(arguments[j]);

    return this[name].apply(this, args);
  },
  
  fade: function(finalize) {
    this.morphO(1, 0, function() {
      if (finalize === true)
        this.remove();
      else if (finalize)
        finalize.call(this);
    });
  },
  
  appear: function(finalize) {
    this.morphO(0, 1, finalize);
  },
  
  morphO: function(i, j, finalize) {
    var s = this.element.style;
    
    // Trigger hasLayout in IE (fixes text rendering bug)
    if (window.ActiveXObject)
      s.width = this.element.offsetWidth + 'px';

    this.morph(i, j, function(k) {
      s.display = k == 0 ? 'none' : '';
        
      if (window.ActiveXObject)
        s.filter = 'alpha(opacity=' + (k * 100) + ')';
      else
        s.opacity = k;
    }, function() {
      if (finalize)
        finalize.call(this);

      s.display = s.opacity = s.filter = '';
    });
  },

  morph: function(i, j, iterator, finalize) {
    var k = i;
    
    iterator.call(this, i);
    
    this.start(function() {
      k += (i < j ? 1 : -1) * 0.05;
      iterator.call(this, Math.round(-100 * (Math.cos(Math.PI * k) - 1) / 2) / 100);
      
      if ((j > i && k >= j) || (j < i && k <= j)) {
        if (finalize)
          finalize.call(this);
        return false;
      }
    }, 20);
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
    this.flags[name] = this[name] = true;
    this.updateNames();
  },
  
  clear: function(name) {
    this.flags[name] = this[name] = false;
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
    
  update: function(data) {
    return this.set(data);
  },
  
  set: function(data) {
    if (typeof data == 'string') {
      this.empty();
      text(this.element).data = data;
    } else {
      var control, node;
      
      for (var name in data) {
        if (control = this[name])        
          if (control.update)
            control.update(data[name]);
          else if (node = text(control))
            node.data = data[name];
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
  
  transform: function(name) {
    var com = this.parent.insert(name, this.toData(), this);
    this.remove();
    return com;
  },
  
  insert: function(name, data, next) {
    return template.spawn(name, data).move(this, next);
  },
  
  move: function(parent, next) {
    if (next)
      parent.element.insertBefore(this.element, next.element);
    else
      parent.element.appendChild(this.element);

    var last;
    if (!next) last = parent.last();

    this.detach();
    next = next || (last || parent)._next;
    this.attach(next ? next._prev : last || parent, parent, next);
        
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
      if (com == template)
        return;
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
  
  createMouseListeners: function(element) {
    var com = this, handler = function(event) { return com.handle(event || window.event) };
    element.onmousedown = handler;
    element.onmouseup   = handler;
    element.onclick     = handler;
  },
  
  toData: function() {
    return {};
  },
  
  toHTML: function() {
    return this.element.innerHTML;
  },
    
  toString: function() {
    return this.name;
  }
});