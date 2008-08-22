bind('contents');

bind('tests', {
  
  run: function() {
    this.count = 0;

    for (var i = 0; i < assertions.length; i++)
      if (!this.failed)
        new Assertion(this, assertions[i][0], assertions[i][1], assertions[i][2], assertions[i][3]).run();
  },
    
  notify: function(assertion) {
    if (this.failed)
      return;
    
    if (assertion.error) {
      this.setState('failed');
      this.update({ summary: 'Error: (' + (assertion.error.message || error) + ') ' +  assertion.description });
    } else if (assertion.result === true) {
      //if (assertion == assertions[assertions.length - 1]) {
        this.setState('passed');
        this.update({ summary: 'Passed! (' + ++this.count + ' assertions)' });
      //}
    } else if (assertion.result === false) {
      this.setState('failed');
      this.update({ summary: 'Failed: ' + assertion.description });
    } else {
      this.setState('waiting');
      this.update({ summary: 'Waiting for ' + assertion.description });
    }
  },
  
  setState: function(id) {
    this.clear('waiting', 'failed', 'passed');
    this.apply(id);
  }
});

var assertions = [], assert = function() {
  var callback, setup, definitions, description;

  switch (arguments.length) {
    case 4: setup       = arguments[2];
    case 3: definitions = arguments[1];
    case 2: callback    = arguments[arguments.length - 1];
    case 1: description = arguments[0];
  }

  assertions.push([description, definitions, setup, callback]);
};

var Assertion = Class.create({
  
  initialize: function(handler, description, definitions, setup, callback) {
    this.handler     = handler;
    this.description = description;
    this.setup       = setup;
    this.definitions = definitions;
    this.callback    = callback;
    this.attempts    = 0;

    for (var name in this.definitions)
      bind(name, this.definitions[name]);
    
    this.contents = this.handler.insert( load(div('contents')) );
    this.message  = load(div('message'));
    
    if (this.setup)
      this.setup.apply(this.contents);
  },
  
  run: function() {
    this.evaluate();
  },
  
  evaluate: function() {
    this.attempts++;
    
    try {
      this.result = this.callback.apply(this.contents);
    } catch (error) {
      this.error = error;
    }
    
    if (typeof this.result == 'undefined') {
      if (this.attempts == 10) {
        this.result = false;
        this.teardown();
      } else {
        var o = this;
        
        setTimeout(function() {
          o.evaluate();
        }, 500);  
      }
    } else {
      this.teardown();
    }
    
    this.handler.notify(this);
  },
  
  teardown: function() {
    for (var name in this.definitions)
      delete(bindings[name]);
    
    this.contents.remove();
  },
  
  getState: function() {
    
  }
});