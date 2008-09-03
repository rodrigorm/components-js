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
    for (var prop in parameters) {
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