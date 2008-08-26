var Component = Class.create({
  
  initialize: function(container, name) {
    this.container = container;
    this.element   = container.element;
    this.document  = container.element.ownerDocument || document;
    this.window    = window;
    this.name      = name;
    this.processes = {};
  },
    
  prev: function(horizontal) {
    return this.container.seek(this.name, 'prev', horizontal);
  },
  
  next: function(horizontal) {
    return this.container.seek(this.name, 'next', horizontal);
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
      
  request: function(method, url, parameters) {
    new Request(this, method, url, parameters).send();
  },
  
  start: function(name, period) {
    if (!this[name])
      throw new Error(this.name + '#' + name + ' is not defined');
      
    var component = this;
    
    this.processes[name] = this.processes[name] || setInterval(function() {
      if (component[name]() === false)
        component.stop(name);
    }, period);
  },
  
  stop: function(name) {
    if (this.processes[name]) {
      clearInterval(this.processes[name]);
      this.processes[name] = null;
    }
  },

  clone: function(deep) {
    return new Tree(this.element.cloneNode(deep)).i.components[this.name];
  },
  
  apply: function(name) {
    if (arguments.length == 1) {
      this.container.addName(name)
      this[name] = true;
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.apply(arguments[i]);
    }
  },
  
  clear: function(name) {
    if (arguments.length == 1) {
      this.container.removeName(name);
      this[name] = false;
    } else {
      for (var i = 0; i < arguments.length; i++)
        this.clear(arguments[i]);
    }    
  },
  
  select: function(component) {
    if (this.selected == component)
      return;

    if (typeof this.selected == 'object') {
      if (this.selected.selected === true)
        this.selected.selected = false;

      if (this.selected.container)
        this.selected.container.removeName('selected');
    }
    
    if (this.selected = component) {
      if (component.container)
        component.container.addName('selected');
      
      if (!component.selected)
        component.selected = true;
    }
    return component;
  },
    
  createListeners: function() {
    var element, attr;
    
    for (var target in this.matches)
      if (this[target]) {
        element = this[target].element || this[target];
        
        for (var event in this.matches[target])
          element[attr = 'on' + event] = this.createListener(this.matches[target][event], target, element[attr]);
          
      }
  },
  
  createListener: function(id, target, tail) {
    var component = this;

    return function(event) {
      event = event || window.event;

      if (tail)
        tail(event);

      if (component[target] && (component[id](event) === false))
        if (event.preventDefault)
          event.preventDefault();
        else
          event.returnValue = false;
    };
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
  
  toString: function() {
    return this.element.id || this.container.toString();
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
    var element, event, parts, matches = {};

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

Component.delegate('update', 'insert', 'append', 'empty', 'collect', 'remove', 'setTag', 'first', 'last', 'fade', 'appear');

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.uncapitalize = function() {
  return this.charAt(0).toLowerCase() + this.substring(1);
};