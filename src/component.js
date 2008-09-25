Component = Class({
  
  initialize: function(name, element, flags, parent) {
    this.name    = name;
    this.element = element;
    this.flags   = flags;
    
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
  
  first: function(name) {
    return this.seek('next', name);
  },
  
  seek: function(id, matcher, sibling) {
    var com = this;
    while ((com = com[id]) && (!sibling || !this.parent || this.contains(com)) && !com.match(matcher));
    return com;
  },
  
  match: function(matcher) {
    return typeof matcher == 'string' ? this.name == matcher : !!matcher.apply(this);
  },
  
  contains: function(com) {
    while (com = com.parent)
      if (com == this) return true;
    return false;
  },
   
  toHTML: function() {
    return this.element.innerHTML;
  },
    
  toString: function() {
    return this.element.id || this.element.className;
  }
});