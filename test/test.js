function test(spawn) {

  test('Load components', function() {
    test('If an element has several component names, use the first - the rest are flags');
  });

  test('Update with data', function() {
    
    test('Escape HTML text');
  });


  test('Set flags', function() {
    var x = spawn('x');
    
    test('Ignore duplicates', function() {
      x.apply('y');
      x.apply('z');
      x.apply('z');
      return x.element.className == 'y z x';
    });
    
    test('Remove non-existent flag', function() {
      x.clear('a');
      return x.element.className == 'y z x';
    });
    
    test('Use the id as a flag name');
  });

  function test(description, callback) {
    var result, message = description;
    try {
      if (callback)
        result = callback();
    } catch(error) {
      message += ' (' + (error.message || error) + ')';
      result   = false;
    }
    if (typeof result != 'undefined') {
      if (!result)
        throw message;
    }

    return message;
  };
};

function start(report, template) {

  //try {
    test(spawn);
  // } catch (e) {
  //   report.update(e);
  //   report.apply('failed');
  // }
  
  if (!report.flags.failed) {
    report.update('All good');
    report.apply('passed');
  }
    
  function spawn(name, data) {
    var com = template.first(name);
    if (com) {
      com = com.clone(true);
      com.update(data || '');
      return com;    
    }
  };
};

bind('template');
bind('report');

bind('x');