bind('tests', {
  
  run: function() {
    var test, i = 0, message, _bindings = tree.bindings;

    while (!this.failed && (test = tests.shift())) {
      i++;
      
      if (test.bindings) {
        tree.bindings = {};
        
        for (var name in test.bindings)
          bind(name, test.bindings[name]);
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
        this.update('Failed (' + i + '): ' + message);
      }
      
      tree.bindings = _bindings;
    }
    
    if (i == 0) {
      this.update('No tests!');
    } else if (!this.failed) {
      this.apply('passed');
      //this.update({ heading: 'Passed!', message: tests.length + ' tests' });
      this.update('Passed! (' + i + '/' + i + ')');
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