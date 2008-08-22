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
    this.element   = container.element;
    this.document  = container.element.ownerDocument || document;
    this.window    = window;
    this.name      = name;
    this.processes = {};
    
    if (!container.container && container.element.parentNode)
      window[name] = window[name] || this;
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
    
    this.processes[name] = this.processes[name] || setInterval(function() { component[name]() }, period);
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
    
  registerEventListeners: function() {
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
          event.cancelBubble = true;
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

Component.delegate('update', 'insert', 'append', 'collect', 'remove', 'setTag', 'first', 'last', 'fade', 'appear');

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.uncapitalize = function() {
  return this.charAt(0).toLowerCase() + this.substring(1);
};

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
    this.document   = element.ownerDocument;
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
      c.registerEventListeners();
    }
  },
    
  update: function(object) {
    if (typeof object == 'string') {
      this.each(function() { this.move() });
      this.element.innerHTML = object;
      return this.element.firstChild;
    } else {
      for (var name in object)
        if (this.objects[name])
          if (this.objects[name].nodeType == 1)
            this.objects[name].innerHTML = object[name];
    }
  },
    
  setTag: function(name) {
    var element = this.document.createElement(name);
    
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
  
  append: function(component, duration) {
    return this.insert(component, null, duration);
  },
     
  insert: function(component, next, duration) {
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
          var c = this.seek(name, 'next');
          
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
    var c;
    
    for (var name in this.components) {
      c = this.components[name];
      
      if (!c[name] || (c[name].nodeType == 1) || c[name].registerEventListeners) {
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
    
  collect: function(name) {
    var list = [];
    this.each(function() {
      if (this.components[name])
        list.push(this.components[name]);
    });
    return list;
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
    
  seek: function(name, id, horizontal) {
    var component, c = this;    
    do
      c = c[id];
    while (c && (!horizontal || c.container == this.container) && !(component = c.components[name]));
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
        return build(text);
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

var bindings = {};
  
function bind(name, source) {
  return bindings[name] = Component.extend(source);
};

function register(callback) {
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
};
  
function load(object) {
  if (typeof object == 'string')
    object = build(object);
  
  var tree = new Tree(object);
  
  if (tree.i && tree.i.element == object)
    for (var name in tree.i.components)
      return tree.i.components[name];
  
  return object;
};
    
function build(text) {
  var node = buildFragment(text).firstChild;

  do {
    if (node.nodeType == 1)
      return node.parentNode.removeChild(node);
  } while (node = node.nextSibling);
};
  
function buildFragment(text) {
  var fragment = document.createDocumentFragment(), container = document.createElement('div');

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
};


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

register(function() {
  load(document.body);
});

