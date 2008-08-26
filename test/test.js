bind('tests', {
  
  run: function() {
    var test, i = 0, message, _bindings = bindings, scope;

    while (!this.failed && (test = tests.shift())) {
      i++;
      scope = null;
      
      if (test.bindings) {
        scope = {};
        
        for (var name in test.bindings)
          scope[name] = Component.extend(test.bindings[name]);
        
        bindings = scope;
      }
      
      if (test.setup)
        test.setup.apply(this);
        
      try {
        if (!test.callback.apply(this))
          throw { toString: function() {} };
        
        this.empty();
      } catch (error) {
        message = (error.message || error).toString();
        message = test.description + (message ? ': ' + message : '');
        
        this.apply('failed');
        //this.update({ heading: 'Failed!', message: message });
        this.update('Failed: ' + message);
      }
      
      bindings = _bindings;
    }
    
    if (!this.failed) {
      this.apply('passed');
      //this.update({ heading: 'Passed!', message: tests.length + ' tests' });
      this.update('All ' + i + ' tests passed');
    }
  }
});

var tests = [], test = function() {
  var callback, setup, bindings, description;

  switch (arguments.length) {
    case 4: setup       = arguments[2];
    case 3: bindings    = arguments[1];
    case 2: callback    = arguments[arguments.length - 1];
    case 1: description = arguments[0];
  }

  return tests.push({
    description: description,
    bindings: bindings,
    setup:       setup,
    callback:    callback
  });  
};