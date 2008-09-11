var Component = Class.create({
  
  initialize: function(container, name) {
    this.container = container;
    this.element   = container.element;
    this.document  = container.element.ownerDocument || document;
    this.window    = window;
    this.name      = name;
  },
    
  prev: function(horizontal) {
    return this.container.seek(this.name, 'prev', horizontal);
  },
  
  next: function(horizontal) {
    return this.container.seek(this.name, 'next', horizontal);
  },

  each: function(name, iterator) {
    return this.container.each(function() {
      if (this.components[name])
        return iterator.apply(this.components[name]);
    });
  },
    
  apply: function(name) {
    if (arguments.length == 1) {
      this.container.addName(name);
      this[name] = this[name] || true;
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.apply(arguments[i]);
    }
  },
  
  clear: function(name) {
    if (arguments.length == 1) {
      this.container.removeName(name);
      
      if (this[name] === true)
        this[name] = false;
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.clear(arguments[i]);
    }    
  },
  
  select: function(component) {
    if (this.selected != component) {
      if (typeof this.selected == 'object')
        this.selected.clear('selected');

      if (this.selected = component)
        this.selected.apply('selected');
      
      return component;
    }
  },
  
  add: function(element) {
    var container, callback;
    
    if (container = this.container.tree.load(element))    
      for (var name in container.components)
        if (this[callback = 'add' + name.capitalize()])
          this[callback](container.components[name]);
  },
  
  remove: function() {
    this.container.remove();
    return this;
  },
  
  clone: function(deep) {
    return this.container.clone(deep).components[this.name];
  },
  
  update: function(data) {
    var o;
    
    if (typeof data == 'string') {
      this.empty();
      this.element.appendChild(document.createTextNode(data));
    } else {  
      for (var name in data) { 
        if (o = this[name]) {
          if (o.update) {
            o.update(data[name]);
          } else if (o.nodeType == 1) {
            if (!o.firstChild) {
              o.appendChild(document.createTextNode(data[name]));
            } else if (o.firstChild == o.lastChild) {
              if (o.firstChild.nodeType == 3) {
                o.firstChild.data = data[name];
              }
            }
          }
        }
      }
    }
    return this;
  },
      
  request: function(method, url, parameters) {
    new Request(this, method, url, parameters).send();
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
  
  start: function(process, period) {
    var component = this, id, callback = typeof process == 'string' ?
      this[process] : process;
    
    id = setInterval(function() {
      if (callback.apply(component) === false)
        clearInterval(id);
    }, period);
  },
    
  createAllListeners: function() {
    for (var target in this.matches)
      if (this[target])
        this.createListeners(target);
  },
  
  createListeners: function(target) {
    var attr, element = this[target].element || this[target];
    
    for (var event in this.matches[target] || {})
      element[attr = 'on' + event] = this.createListener(this.matches[target][event], target, element[attr]);    
  },
  
  createListener: function(id, target, tail) {
    var component = this;

    return function(event) {
      var result = true;
      
      event = event || window.event;

      if ((tail && tail(event) === false))
        result = false;
        
      if (component[target] && (component[id](event) === false))
        result = false;
      
      return result;
    };
  },
  
  toHTML: function() {
    return this.element.innerHTML;
  },
    
  toString: function() {
    return this.element.id || this.element.className;
  }
});

extend(Component, {

  Listener: /^on(abort|beforeunload|blur|change|click|dblclick|error|focus|keydown|keypress|keyup|load|mousedown|mousemove|mouseout|mouseover|mouseup|reset|resize|select|submit|unload)(\w*)$/i,

  errors: false,
  
  extend: function(source) {
    source = source || {};
    
    return Class.create(extend(extend({
      matches: Component.matchListeners(source)
    }, this.prototype), source));
  },
  
  matchListeners: function(source) {
    var target, event, parts, matches = {};

    for (var id in source) {
      if (typeof source[id] == 'function') {
        if (parts = id.match(this.Listener)) {
          event  = parts[1].toLowerCase();
          target = parts[2].uncapitalize() || 'element';

          
          matches[target]        = matches[target] || {};
          matches[target][event] = id;
        }
      }
    }
    return matches;
  },

  delegate: function(method) {
    if (arguments.length > 1)
      for (var i = 0; i < arguments.length; i++)
        this.delegate(arguments[i]);
    else
      this.prototype[method] = function() {
        return this.container[method].apply(this.container, arguments);
      }
  }
});

Component.delegate('build', 'insert', 'append', 'replace', 'empty', 'collect', 'setTag', 'first', 'last');

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.uncapitalize = function() {
  return this.charAt(0).toLowerCase() + this.substring(1);
};