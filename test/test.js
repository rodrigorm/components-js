bind('x');
bind('y');
bind('z');

function test() {

  assert.count = 0;
  
  test('Load components', function() {
    test('multiple component names on a single container', function() {
      var c = build('a x y b');
      test('use first name only', function() {
        com(c, 'x');
        empty(c.y);
      });
      test('with flags', function() {
        flag(c.a);
        flag(c.b);
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
      empty(x.y);
      
      test('after insertion', function() {
        build('y', tag('b', 'six')).move(x);
        com(x.y, 'y');
      });
      
    });
    
    test('have one reference to a control component, ignoring flags', function() {
      var x = build('x', tag('a y'));
      com(x.y, 'y');
      empty(x.a);
    });
  });
  
  test('Access parent', function() {
    var x = build('x', tag('y'));
    
    com(x.y.x, 'x');
    com(x.y.parent, 'x');
    
    test('after move', function() {
      var x = build('x', tag('z')), y = build('y');
      x.z.move(y);
      empty(x.z);
      com(y.z.y, 'y');
      com(y.z.parent, 'y');
    });
    
    test('after remove', function() {
      var x = build('x', tag('y'));
      y = x.y.remove();
      empty(y.parent);
      empty(y.x);
    });
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
    var x = build('x');
    
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

  // test('Mouse events', function() {
  //   var x = build('x', tag('a', tag('b'))), n = 0, a = 0, b = 0;
  //   
  //   x.onClick  = function() { n++ };
  //   x.onClickA = function() { a++ };
  //   x.onClickB = function() { b++ };
  //   
  //   x.handle({ type: 'click', target: x.a });
  //   x.handle({ type: 'click', target: x.b });
  //   x.handle({ type: 'click', target: x.element });
  //   
  //   expect('2 clicks on a', a, 2);
  //   expect('1 click on b', a, 1);
  //   expect('3 clicks on element', a, 3);
  // });
  
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
    
  function empty(o) {
    assert('empty', o, function() { return o == null })
  };
  
  function data(o, data) {
    var element = (o || {}).element || o;
    assert('data', element.innerHTML, function() { return (element || {}).nodeType == 1 && element.innerHTML == data })
  };
  
  function element(o, data) {
    assert('control', (o || {}).innerHTML, function() { return (o || {}).nodeType == 1 && o.innerHTML == data })
  };
  
  function com(o, name) {
    assert('component', o, function() { return (o || {}).name == name })
  };
  
  function flag(v) {
    assert('flag', v, function() { return v === true })
  };
  
  function expect(name, a, b) {
    assert(name, a, function() { return a == b });
  };
  
  function assert(name, o, test) {
    assert.count++;
    if (!test(o)) throw 'expected ' + name + ': ' + o;
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
    content.update(e.toString());
    content.apply('failed');
  }
  
  if (count > 0 && !content.flags.failed) {
    content.update(count + '/' + count);
    content.apply('passed');
  }    
};

bind('content');