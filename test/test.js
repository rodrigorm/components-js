bind('x');
bind('y');
bind('z');

function test() {

  function assert(name, o, test) {
    assert.count++;
    if (!test(o)) throw 'expected ' + name + ': ' + o;
  };

  assert.count = 0;

  test('Load components', function() {
    test('multiple component names on a single container', function() {
      var c = build('x y z');
      test('use first name only', function() {
        com(c, 'x');
      });
      test('create flags', function() {
        // flag(c.y);
        // flag(c.z);
      });
    });
  });
  
  test('Access controls', function() {
    var x = build('x',
      tag('a', 'one') + 
      tag('a', 'two') + 
      tag('y', 
        tag('b', 'three')) + 
      tag('y', 
        tag('b', 'four')) +
      tag('b', 'five'));

    element(x.a,   'one');
    element(x.b,   'five');
    element(x.y.b, 'three');
    
    test('after removal', function() {
      x.y.remove();
      element(x.y.b, 'four');
      x.y.remove();
      undefined(x.y);
      
      test('after insertion', function() {
        build('y', tag('b', 'six')).move(x);
        com(x.y, 'y');
      });
      
    });
    
    test('have one reference to a control component, ignoring flags', function() {
      var x = build('x', tag('a y'));
      com(x.y, 'y');
      undefined(x.a);
    });
  });
  
  test('Access parent', function() {
    var x = build('x', tag('z')), y = build('y');
    com(x.z.x, 'x');
    
    test('after move', function() {
      x.z.move(y);
      undefined(x.z);
      com(y.z.y, 'y');
    })
  });

  test('Update data', function() {
    var x = build('x',
      tag('a', 'one') + 
      tag('b') + 
      tag('c1', '<span>three</span>') +
      tag('c2', 'x<span>three</span>') +
      tag('d', tag('e', 'four') + tag('f', 'five')));
    
    test('control with text', function() {
      x.update({ a: 'a' });
      element(x.a, 'a');
    });
    
    test('empty control', function() {
      x.update({ b: 'b' });
      element(x.b, 'b');
    });
    
    test('control with sub-element', function() {
      x.update({ c1: 'c' });
      element(x.c1.firstChild, 'c');
    });
    
    test('control with sub-element a several text', function() {
      x.update({ c2: 'c' });
      element(x.c2.lastChild, 'three');
    });
    
    test('control with multiple sub-elements', function() {
      x.update({ d: 'd' });
      element(x.e, 'four');
      element(x.f, 'five');
    });
    
    test('replace all with text', function() {
      x.update('x');
      element(x.element, 'x');
      
      test('escape HTML', function() {
        x.update('<span>x</span>');
        assert('text', x.element.firstChild, function() {
          return x.element.firstChild == x.element.lastChild &&
                 x.element.firstChild.nodeType == 3;
        })
      })
    });
  });

  test('Set flags', function() {
    // var x = spawn('x');
    // 
    // test('Ignore duplicates', function() {
    //   x.apply('y');
    //   x.apply('z');
    //   x.apply('z');
    //   return x.element.className == 'y z x';
    // });
    // 
    // test('Remove non-existent flag', function() {
    //   x.clear('a');
    //   return x.element.className == 'y z x';
    // });
    // 
    // test('Use the id as a flag name');
  });

  test('Event listeners', function() {
    
  });
  
  test('Traversal', function() {
    var x = build('x',
      tag('y', 'one') +
      tag('z',
        tag('y', 'two')) +
      tag('y', 'three'));
    
    test('seek forward', function() {
      data(x.next('y'), 'one');
      data(x.next('y').next('y'), 'two');
      data(x.next('y').next('y').next('y'), 'three');
    });
    
    test('first', function() {
      data(x.first(), 'one');
      
      test('match by name', function() {
        data(x.first('z').y, 'two');
      });
      test('match with callback', function() {
        data(x.first(function() {
          return this.name == 'y' && !!this.z;
        }), 'two');
      });
    });
    
    test('last', function() {
      data(x.last(), 'three');
    });
  });
    
  test('Editing', function() {
    var x1 = build('x', tag('x', tag('x') + tag('y', tag('y')) + tag('z'))).x;
    var x2 = x1.chop(x1.y);
    
    test('chop', function() {
      com(x1.x, 'x');
      com(x2.y.y, 'y');
      com(x2.z, 'z');
      undefined(x1.y);
      undefined(x1.z);
    });
  });

  function undefined(o) {
    assert('undefined', o, function() { return typeof o == 'undefined' })
  };
  
  function data(o, data) {
    var element = (o || {}).element || o;
    assert('data', element.innerHTML, function() { return (element || {}).nodeType == 1 && element.innerHTML == data })
  };
  
  function element(o, data) {
    assert('control', o.innerHTML, function() { return (o || {}).nodeType == 1 && o.innerHTML == data })
  };
  
  function com(o, name) {
    assert('component', o, function() { return (o || {}).name == name })
  };
  
  function flag(v) {
    assert('flag', v, function() { return v === true })
  };
  
  function test(description, callback) {
    try {
      if (callback)
        callback();
    } catch(error) {
      throw description + ': ' + (error.message || error);
    }
  };
  
  function build(name, content) {
    var element = document.createElement('div');
    element.innerHTML = content;
    element.className = name;
    return load(element);
  };

  function tag(name, content) {
    return '<div class="' + name + '">' + (content || '') + '</div>';
  };
  
  return assert.count;
};

function start() {

  try {
    var count = test();
  } catch (e) {
    Com.report.update(e.toString());
    Com.report.apply('failed');
  }
  
  if (!Com.report.flags.failed) {
    Com.report.update(count + '/' + count);
    Com.report.apply('passed');
  }    
};

bind('report');