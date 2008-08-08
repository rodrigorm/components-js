var Component = Class.create({
  
  initialize: function(container, name) {
    this.container = container;
    this.name      = name;
    this.listeners = {};
    
    this.set('window',   window);
    this.set('document', container.element.ownerDocument || document);
    this.set('element',  container.element);
  },
  
  run: function() {},
    
  prev: function(horizontal) {
    var component;
    
    if (component = this.container.getPrev(this.name))
      if (!horizontal || (component.container.container == this.container.container))
        return component;
  },
  
  next: function(horizontal) {
    var component;
    
    if (component = this.container.getNext(this.name))
      if (!horizontal || (component.container.container == this.container.container))
        return component;
  },

  each: function(name, iterator) {
    var result;
    
    return this.container.each(function() {
      if (this.components[name] && (result = iterator.apply(this.components[name])))
        return result;
    });
  },
  
  add: function(element) {
    var callback, tree = new Tree(element);
    
    if (tree.i && (tree.i.element == element)) {
      for (var name in tree.i.components)
        if (this[callback = 'add' + name.capitalize()])
          this[callback](tree.i.components[name]);
    }
  },
  
  set: function(name, object) {
    if (this[name] && !(this[name].nodeType == 1 || this[name].name))
      return false;
    
    this[name] = object;
    
    for (var event in (this.matches[name] || {}))
      this.registerAsListener(event, name, this.matches[name][event]);
    
    return object;
  },
  
  unset: function(name) {
    if (this[name]) {
      for (var event in (this.matches[name] || {}))
        this.unregisterListener(event, name, this.matches[name][event]);
      
      delete(this[name]);
    }
  },
    
  request: function(method, url, parameters) {
    new Request(this, method, url, parameters).send();
  },
  
  setInterval: function(period) {
    if (!this.onInterval)
      throw new Error(this.name + '#onInterval is not defined');
      
    var component = this;
    
    this.interval = setInterval(function() { component.onInterval() }, period);
  },
  
  clearInterval: function() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;        
    }
  },

  clone: function(deep) {
    return new Tree(this.element.cloneNode(deep)).i.components[this.name];
  },

  apply: function(name) {
    if (arguments.length == 1) {
      if (!this[name]) {
        this.container.addName(name)
        this[name] = true;
      }
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.apply(arguments[i]);
    }
  },
  
  clear: function(name) {
    if (arguments.length == 1) {
      if (this[name]) {
        this.container.removeName(name);
        this[name] = false;
      }
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.clear(arguments[i]);
    }    
  },
  
  select: function(component) {
    if (this.selected == component)
      return;

    if (this.selected)
      this.selected.clear('selected');
    
    if (this.selected = component)
      component.apply('selected');
  },
      
  getHTML:   function() { return this.element.innerHTML },  
  getWidth:  function() { return this.element.offsetWidth },
  getHeight: function() { return this.element.offsetHeight },

  getPoint:  function() {
    var point = [0, 0], element = this.element;
    do {
      point[0] += element.offsetTop  || 0;
      point[1] += element.offsetLeft || 0;
      element   = element.offsetParent;
    } while (element);
    return point;
  },
  
  registerAsListener: function(event, name, method) {
    this.listeners = this.listeners || {};
    
    var target = this[name].element || this[name], listener = this.createListener(method);
    
    this.listeners[name]        = this.listeners[name] || {};
    this.listeners[name][event] = listener;

    if (target.addEventListener)
      target.addEventListener(event, listener, false);
    else if (target.attachEvent)
      target.attachEvent('on' + event, listener);
  },

  unregisterListener: function(event, name) {
    var target = this[name].element || this[name], listener = this.listeners[name][event];
    
    delete(this.listeners[name][event]);
    
    if (target.removeEventListener)
      target.removeEventListener(event, listener, false);
    else if (target.detachEvent)
      target.detachEvent('on' + event, listener);
  },

  unregisterListeners: function() {
    for (var name in this.listeners)
      for (var event in this.listeners[name])
        this.unregisterListener(event, name);
  },

  createListener: function(method) {
    var component = this, listener = function(event) {
      event = event || window.event;
      
      if (component[method](event) === false) {
        if (event.preventDefault)
          event.preventDefault();
        else
          event.returnValue = false;
      }
    };

    if (Component.errors)
      return function(event) {          
        try {
          listener(event);
        } catch (error) {
          Component.errors.alert(component.name + '#' + method + ': ' + (error.message || error.toString()) );
        }
      }
    else
      return listener;
  },

  toString: function() {
    return this.container.toString();
  }
});

extend(Component, {

  Listener: /^on(abort|beforeunload|blur|change|click|dblclick|error|focus|keydown|keypress|keyup|load|mousedown|mousemove|mouseout|mouseover|mouseup|reset|resize|select|submit|unload)(\w*)$/i,

  errors: false,
  
  extend: function(source) {
    return Class.create(extend(extend({
      matches: Component.matchListeners(source)
    }, this.prototype), source));
  },
  
  matchListeners: function(source) {
    var element, event, matches, listeners = {};

    for (var id in source) {
      if (typeof source[id] == 'function') {
        if (matches = id.match(this.Listener)) {
          event   = matches[1].toLowerCase();
          element = matches[2].uncapitalize();
          
          element = element || 'element';

          listeners[element]        = listeners[element] || {};
          listeners[element][event] = id;
        }
      }
    }
    return listeners
  },

  delegate: function(method) {
    this.prototype[method] = function() {
      return this.container[method].apply(this.container, arguments);
    }
  }
});

Component.delegate('insert');
Component.delegate('append');
Component.delegate('collect');
Component.delegate('remove');
Component.delegate('update');
Component.delegate('first');
Component.delegate('last');
Component.delegate('fade');
Component.delegate('appear');

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.uncapitalize = function() {
  return this.charAt(0).toLowerCase() + this.substring(1);
};