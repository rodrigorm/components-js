/*  
  Components: JavaScript application framework
  Copyright 2008 Adam Bones
  
  See http://code.google.com/p/components-framework/
  
  This code is freely distributable under the terms of an MIT-style license.
/*--------------------------------------------------------------------------*/

var Class = {

  create: function(source) {
    function klass() {
      if (this.initialize)
        this.initialize.apply(this, arguments);
    };

    extend(klass.prototype, source || {});

    return klass;
  }
};

function extend(object, source) {
  source = source || {};
  
  for (var id in source)
    object[id] = source[id];

  if (source.toString != Object.prototype.toString) // force IE to recognise when we override toString
    object.toString = source.toString;

  return object;
}

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

var Tree = Class.create({
  
  initialize: function(element, container) {
    this.klasses = element.ownerDocument.bindings;
    this.load(element, container);
    this.invoke('run');
    this.registerUnload();
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
        
        if (this.klasses[id]) {
          container = container || this.push(new Container(element, ids, components, parent));
          components[id] = new this.klasses[id](container, id);
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
  },
    
  registerUnload: function() {
    if (window.attachEvent) {
      var tree = this; 
      window.attachEvent('onunload', function() { tree.invoke('unregisterListeners') });
    }
  }
});

var Container = Class.create({

  initialize: function(element, names, components, container) {
    this.element    = element;
    this.document   = element.ownerDocument;
    this.container  = container;
    this.names      = names;
    this.components = components;
    this.objects    = {};
  },
    
  run: function() {
    for (var name in this.components)
      this.components[name].run();
  },
    
  update: function(object) {
    return typeof object == 'string' ? this.updateText(object) : this.updateElements(object);
  },
  
  updateText: function(data) {
    this.each(function() {
      this.move();
    });
    
    if (this.element.childNodes.length == 1 && this.element.firstChild.nodeType == 3) {
      this.element.firstChild.data = data;
    } else {
      this.element.innerHTML = '';
      this.element.appendChild(this.document.createTextNode(data));      
    }
    return this.element.firstChild;
  },
  
  updateElements: function(object) {
    for (var id in object)
      if (this.objects[id] && this.objects[id].nodeType == 1)
        this.objects[id].innerHTML = object[id];
  },
  
  append: function(component, duration) {
    return this.insert(component, null, duration);
  },
     
  insert: function(component, next, duration) {
    if (typeof component == 'string')
      component = this.element.ownerDocument.load(component);
    
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
      
      prev = this.getLast() || this;
      
      if (prev != insert)
        insert.move(prev, this, prev.next == insert ? prev.next.next : prev.next);
    }

    if (duration && (duration > 0))
      return component.appear(duration);

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
          var c = this.getNext(name);
          
          while (c && this.contains(c))
            c = c.next()

          if (c && this.container.contains(c))
            this.container.set(name, c);            
        }
      }
    }
    
    var i = this, j = this.getLast() || this;

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
      if (this.names[i] == name)
        return true;
    return false;
  },

  remove: function(duration) {
    var container = this;
    
    if (duration > 0)
      return this.fade(duration, function() { container.remove() });
    
    this.move();
    this.element.parentNode.removeChild(this.element);
  },
  
  fade: function(duration, callback) {
    var container = this;
    
    new Transition(container.element, 1, 0, duration, function(k) {
      container.setOpacity(k);
    }, function() {
      container.element.style.display = 'none';
      
      if (callback)
        callback.call(container);
    });
  },
  
  appear: function(duration, callback) {
    this.element.style.display = '';
    
    var container = this;
    
    new Transition(container.element, 0, 1, duration, function(k) {
      container.setOpacity(k);
    }, function() {
      if (callback)
        callback.call(container);
    });
  },
  
  setOpacity: function(k) {
    if (window.ActiveXObject)
      this.element.style.filter = "alpha(opacity=" + (k * 100) + ")";
    else
      this.element.style.opacity = k;
  },

  set: function(id, object) {    
    for (var name in this.components)
      this.components[name].set(id, object);
    
    return this.objects[id] = object;
  },
  
  unregisterListeners: function() {
    for (var name in this.components)
      this.components[name].unregisterListeners();
  },

  unset: function(id) {
    for (var name in this.components)
      this.components[name].unset(id);

    delete(this.objects[id]);
  },
    
  collect: function(name) {
    var list = [];
    this.each(function() {
      if (this.components[name])
        list.push(this.components[name]);
    });
    return list;
    // var components = [], containers = this.getChildren();
    //   
    // for (var i = 0; i < containers.length; i++)
    //   if (containers[i].components[name])
    //     components.push(containers[i].components[name]);
    //   
    // return components;
  },
 
  each: function(iterator) {
    var prev = this, c = this.next;
    
    while (c && this.contains(c)) {
      
      if (result = iterator.apply(c))
        return result;
      
      if (c == prev.next) {
        prev = c;
        c = c.next;
      } else { // the container was removed - jump to the following
        c = prev.next;
      }
    }
    // var result, c = this;
    // while ((c = c.next) && this.contains(c) && !(result = iterator.apply(c)));
    // return result;
  },
  
  contains: function(child) {
    var c = child;
    
    while (c = c.container)
      if (c == this) return true;

    return false;
  },
    
  first: function(name) {
    return this.each(function() {
      return this.components[name];
    });
  },
  
  last: function(name) {
    var component;
    this.each(function() {
      component = this.components[name] || component;
    });
    return component;
  },
  
  getPrev: function(name) {
    var component, container = this.prev;
    
    while (container && !(component = container.components[name]))
      container = container.prev;
      
    return component;
  },
  
  getNext: function(name) {
    var component, container = this.next;

    while (container && !(component = container.components[name]))
      container = container.next;
      
    return component;
  },
  
  getLast: function() {
    var last;
    this.each(function() { last = this });
    return last;
  },
  
  toString: function() {
    return this.names.join(' ');
  }
});

var Request = Class.create({
  
  initialize: function(component, method, url, parameters) {
    this.component  = component;
    this.method     = method.toUpperCase();
    this.url        = url;
    this.headers    = {};
    this.transport  = this.getTransport();
        
    if (!this.method.match(/GET|POST/i)) {
      parameters._method = method;
      this.method = 'POST';
    }

    this.parameters = extend({}, parameters)
    this.query      = this.getQuery(this.parameters);
    
    if ((this.method == 'GET') && this.query) {
      this.url  += '?' + this.query;
      this.query = '';
    } 
  },

  open: function() {
    this.transport.open(this.method, this.url, true);
  },
    
  send: function() {
    this.open();

    for (var prop in Request.Headers)
      this.transport.setRequestHeader(prop, Request.Headers[prop]);

    this.transport.onreadystatechange = this.getCallback();
    this.transport.send(this.query);
  },

  dispatch: function(code, content) {
    var callback = '';
    
    if (code >= 500) {
      callback = 'debug';
    } else if (code >= 400) {
      callback = 'error'
    } else if (!code || code == 0 || (code >= 200 && code < 300)) {
      if (content) {
        if (content.nodeType >= 0)
          callback = 'add';
        else
          callback = 'update';
      } else if ((this.parameters._method || this.method) == 'DELETE') {
        callback = 'remove';
      }
    }
    
    if (this.component[callback])
      this.component[callback](content);
    else if (this.component.handle)
      this.component.handle(code, content);
  },
  
  getCallback: function() {
    var request = this;
    return function() {
      if (request.transport.readyState == 4) {
        request.dispatch(
          request.transport.status,
          request.getContent(
            request.transport.responseText),
            request.transport.getResponseHeader('Content-Type'));

        request.transport.onreadystatechange = function() {};
      }
    }
  },
  
  getContent: function(text, type) {
    type = type || 'text/html';
    
    if (text && text != ' ') {
      if (type.match(/html/i)) {
        return this.component.document.build(text);
      } else if (type.match(/json/i)) {
        return eval('(' + text + ')');
      }  
    }
  },
  
  getQuery: function(parameters) {
    var parts = [];
    for (prop in parameters) {
      parts.push(encodeURIComponent(prop) + '=' + encodeURIComponent(parameters[prop]));
    }
    return parts.join('&');
  },
    
  getTransport: function() {
    try {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP')
      } catch(error) {
        try {
          return new ActiveXObject('Microsoft.XMLHTTP')
        } catch(error) {
          return new XMLHttpRequest()
        }
      }
    } catch(error) {
      return null;
    }
  }
});

Request.Headers = {
  'X-Requested-With':  'XMLHttpRequest', // keep compatibility with Ajax in Rails
  'Content-type':      'application/x-www-form-urlencoded',
  'Accept':            'text/html, application/json, text/xml, */*',
  'If-Modified-Since': 'Thu, 1 Jan 1970 00:00:00 GMT' // Stop IE7 caching
};

var Transition = Class.create({
  
  initialize: function(element, i, j, duration, setStyle, finalize) {
    this.element  = element;
    this.i = i;
    this.k = i;
    this.j = j;
    this.duration = duration;
    this.setStyle = setStyle;
    this.finalize = finalize;
    
    this.startAt = this.getTime();
    this.endAt   = this.startAt + this.duration;
    
    // Trigger hasLayout in IE (fixes text rendering bug)
    if (this.element.currentStyle)
      this.element.style.width = this.element.offsetWidth + 'px';
    
    this.setStyle(this.i);
    this.setInterval();
  },
  
  setInterval: function() {
    var transition = this;
    
    this.interval  = setInterval(function() {
      transition.onInterval();
    }, Math.round(1000 / Transition.rate));
  },
  
  onInterval: function() {
    this.progress = (this.getTime() - this.startAt) / this.duration;
    
    if (this.progress <= 1) {
      this.progress = -1 * (Math.cos(Math.PI* this.progress) - 1) / 2;
      
      this.setStyle(this.i + ((this.j - this.i) * this.progress));
    } else {
      this.setStyle(this.j);
      clearInterval(this.interval);
      
      if (this.element.currentStyle)
        this.element.style.width = '';
      
      if (this.finalize)
        this.finalize();
    }
  },
  
  getK: function() {
    var progress = (this.time - this.startAt) / duration;
    
    return this.i + ((this.j - this.i) * (this.endAt - this.time));
  },
  
  getTime: function() {
    return new Date().getTime();
  }
});

Transition.rate = 50;

var DocumentMethods = {
   
  bindings: {},
  
  bind: function(name, source) {
    return this.bindings[name] = Component.extend(source);
  },

  register: function(callback) {
    var userAgent = navigator.userAgent.toLowerCase();

    if (/webkit/.test(userAgent)) {
      var timeout = setTimeout(function() {
        if (document.readyState == 'loaded' || document.readyState == 'complete' ) {
          callback();
        } else {
          setTimeout(arguments.callee, 10);
        }
      }, 10); 
    } else if ((/mozilla/.test(userAgent) && !/(compatible)/.test(userAgent)) || (/opera/.test(userAgent))) {
      document.addEventListener('DOMContentLoaded', callback, false);
    } else if (document.uniqueID && document.expando) { // ie
      // http://www.hedgerwow.com/360/dhtml/ie-dom-ondocumentready.html
      var tempNode = document.createElement('document:ready'); 
      
      (function () { 
        if (document.loaded) return;

        try {
          tempNode.doScroll('left');
          
          if (!document.body)
            throw new Error();
          
          document.loaded = true;
          callback();
          tempNode = null; 
        } catch(e) {
          setTimeout(arguments.callee, 0); 
        } 
      })();
    }
  },
  
  load: function(element) {
    if (typeof element == 'string')
      element = this.build(element);
    
    var tree = new Tree(element);
    
    if (tree.i && tree.i.element == element)
      for (var name in tree.i.components)
        return tree.i.components[name];
    
    return element;
  },
    
  build: function(text) {
    var node = this.buildFragment(text).firstChild;

    do {
      if (node.nodeType == 1)
        return node.parentNode.removeChild(node);
    } while (node = node.nextSibling);
  },
  
  buildFragment: function(text) {
    var fragment = this.createDocumentFragment(), container = this.createElement('div');

    var containingTags = [];

    var matches = text.match(/^\s*<(li|td|tr|tbody)/i);

    if (matches)
      containingTags = Tags.containersFor(matches[1].toLowerCase());

    for (var i = 0; i < containingTags.length; i++) text = "<" + containingTags[i] + ">" + text + "</" + containingTags[i] + ">";
    container.innerHTML = text;
    for (var i = 0; i < containingTags.length; i++) container = container.firstChild;

    for (var i = container.childNodes.length - 1; i > -1; i--) fragment.insertBefore(container.childNodes[i], fragment.firstChild);

    if (!fragment.firstChild && text.length > 0)
      fragment.appendChild(this.createTextNode(text));

    return fragment;
  }
};

extend(document, DocumentMethods);

var Tags = {
  
  containersFor: function(tag) {
    tag = tag.toLowerCase();
    
    var containingTags = [], containingTag = Tags.containers[tag];
    if (containingTag) {
      containingTags = Tags.containersFor(containingTag);
      containingTags.unshift(containingTag);
    }
    return containingTags;
  },
  
  containers: {
    li:    'ul',
    td:    'tr',
    tr:    'tbody',
    tbody: 'table'
  }  
};

document.register(function() {
  document.load(document.body);
});

