bind('x');
bind('y');
bind('z');
bind('s', {
  toString: function() { return this.toHTML() }
});

function x(content) { return div('x', content) }
function y(content) { return div('y', content) }
function z(content) { return div('z', content) }
function s(content) { return div('s', content) }

function div(names, content) { return '<div class="' + (names || '') + '">' + (content || '') + '</div>' };

test('build non-contained elements', function() {
  return build('<p></p>').tagName == 'P' && 
         build('<P></P>').tagName == 'P' && 
         build('<br/>  ').tagName == 'BR';
});

test('build orphaned table and list elements', function() {
  return build('<td></td>').tagName == 'TD' &&
         build('<tr></tr>').tagName == 'TR' &&
         build('<li></li>').tagName == 'LI';
});

test('build the first tag, ignore subsequent top-level tags', function() {
  return build('<em></em> <strong></strong>').tagName == 'EM' &&
         build('<li></li> <strong></strong>').tagName == 'LI';
});

test('identify components with either class names and ids', function() {
  this.append('<span id="x">..</span>');
  this.append('<span class="x">..</span>');
  return this.collect('x').length == 2;
});

test('cannot remove an id', function() {
  this.append('<span id="x" class="y z">...</span>');
  this.y.container.removeName('z');
  this.y.container.removeName('x');

  return this.y.element.className == 'y' && this.x.element == this.y.element;
});

test('handle duplicate class names and extraneous whitespace', function() {
  this.append(div(' x x y '));
  return this.x.container.names == 'x,y' && this.collect('x').length == 1;
});

test('a component has access to containing components', function() {
  return this.insert(x(y(z()))).y.z.y.x == this.x;
});

test('a component has access to the first instance of a sub-component', function() {
  this.append(x(s('a') + s('b')));
  this.append(s('c'));

  return this.x.s == 'a' &&
         this.s   == 'c' &&
         this.collect('s')   == 'a,b,c' &&
         this.x.collect('s') == 'a,b';
});

test('precedence is given to the subtree over containers when assigning properties', function() {
  return this.build('x').build('y').build('x').y.x == this.last('x');
});

test('properties are updated after removing a child component', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.s.remove();
  return this.s == 'two';
});

test('seek', function() {
  this.build('s', 'a');
  this.build('x');
  this.x.build('s', 'b');
  this.x.build('s', 'c');
  this.build('s', 'd');
  
  return [this.s, this.s.next(), this.s.next().next(), this.s.next().next().next(), this.s.next().next().next().next()] == 'a,b,c,d,' &&
         [this.s, this.s.next(true), this.s.next(true).next(true)] == 'a,d,' &&
         [this.x.s, this.x.s.next(true), this.x.s.next(true).next(true)] == 'b,c,';
});

test('la la la', function() {
  this.build('x').build('y').build('z');
  this.build('y').build('z');
  this.x.replace(this.x.y.z);
  return this.z.next().y == this.y;
});

test('properties are updated after inserting a component', function() {
  this.append(s('two'));
  this._s = this.s;
  this.insert(s('one'), this.s);

  return this._s == 'two' && this.s == 'one';
});

test('access with first() and last()', function() {
  this.append(x(s('a') + y(s('b')) + s('c') + y(z(s('d')))));
  return this.collect('s') == 'a,b,c,d' && 
         this.first('s') == 'a' && 
         this.first('s').next() == 'b' && 
         this.last('s').prev() == 'c'
         this.last('s') == 'd';
});

test('iterate over components of some type with each()', function() {
  this.append(x(s('a') + y(s('b') + s('c')) + s('d')));
  return this.each('s', function() { if (this == 'c') return this }) == 'c';
});

test('remove all content with empty()', function() {
  this.append(x( s('a') + y(z(s('b'))) + y(s('c')) ));
  this.x.y.empty();
  return this.collect('y').length == 2 && this.collect('s') == 'a,c' && !this.first('z');
});

test('find a container from itself', function() {
  return this.container.find(this.element).container == this.container;
});

test('find the prev container to a node', function() {
  this.append(x(div('a') + div('b') + y()));
  
  return this.container.find(this.x.a).next == this.x.y.container &&
         this.container.find(this.x.b).prev == this.x.container &&
         this.container.find(this.x.y.element).prev == this.x.container;
});

test('inserting a component in the same position leaves the tree unchanged (using first child)', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.insert(this.s, this.s.next());
  return this.collect('s') == 'one,two';
});

test('inserting a component in the same position leaves the tree unchanged (using last child)', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.append(this.s.next());
  return this.collect('s') == 'one,two';
});

test('remove all child instances of a component', function() {
  var i = 0;
  
  this.append(x(x(x())));
  this.append(x());
  this.append(x());
  
  while (this.x) {
    this.x.remove();
    i++;
  }

  return !this.x && i == 3 && this.collect('x').length == 0;
});

test('remove all sub instances of a component', function() {
  var i = 0;
  
  this.append(x(x(x())));
  this.append(x());

  while (this.x) {
    this.last('x').remove();
    i++;
  }

  return !this.x && i == 4 && this.collect('x').length == 0;
});

test('append a component that is already the last component but not the last node', function() {
  this.append(div('x', s('one') + s('two') + div('foo')));

  this.x.append(this.x.s.next());
  
  return this.x.element.lastChild == this.x.s.next().element && this.collect('s') == 'one,two';
});

test('names used by Component are ignored when creating properties', function() {
  this.append(x(div('remove') + div('container a')));
  return (typeof this.x.remove == 'function') && (this.x.a != this.x.container);
});

test('update containers after a removal', function() {
  this.append(x(y(z())));      
  this.append(this.x.y);

  return this.y.z && this.y.container.container && !this.y.x;
});



test('lists are updated after inserting a new component', function() {
  this.append(s('one'));
  this.append(x());
  this.x.append(s('two'))
  this.append(s('three'));

  return this.collect('s') == 'one,two,three';
});

test('the whole tree is accessible when a component run', {
  collection: {
    
    run: function() {
      this.passed = this.accessible();
    },
    
    accessible: function() {
      return this.collect('item').length == 2;
    }
  },
  
  item: {
    
    run: function() {
      this.passed = this.collection && this.collection.accessible();
    }
  }
}, function() {
  this.append(div('collection', div('item') + div('item')));

  return this.collection.passed && this.collection.item.passed && this.collection.last('item').passed;
});

test('every component is run exactly once', {
  a: {
    run: function() {
      this.count = (this.count || 0) + 1;
    }
  }
}, function() {
  this.append(div('a'));
  this.append(div('a'));

  this.a.append(div('a'));

  return !this.each('a', function() { return this.count != 1 });
});

test('new components are run after being added', {
  x: {
    addY: function(y) { this.y = y }
  },
  
  y: {
    run: function() { this.ready = true }
  }
}, function() {
  this.append(x());
  this.x.add(build(y()));
  return this.x.y && this.x.y.ready;
});

test('inserting a component moves the component in the tree', function() {
  this.append(x());
  this.append(y());
  this.x.insert(this.y)

  return !!this.x.y.x;
});

test('replace components', function() {
  this.append(x(y()));
  return this.x.replace(this.x.y) === this.y &&
         this.y.replace(x()) === this.x &&
         !this.x.y && !this.y;
});

test('spawn components from those already in the tree', {
  foo: {}
},
function() {
  this.append(div('foo'));
  return this.build('foo').toHTML() == '' && this.build('foo', 'abc').toHTML() == 'abc';
});

test('inserting markup returns the first newly created root component', function() {
  return this.append(x(y('...'))).y.x;
});

test('replace all container content with text', function() {
  this.append(x());
  
  return this.update('abc').toHTML() == 'abc' &&
        !this.x;
});

test('update text for elements', function() {
  this.append(x(div('a s', 'one') + div('b s', 'two') + div('c s', 'three')));
  this.x.foo = this.x.b;
  this.x.update({ s: 'one!', foo: 'two!', c: 'three!' });

  return this.collect('s') == 'one!,two!,three!';
});

test('update with an empty string creates an empty text node', function() {
  return this.update('').element.childNodes.length == 1 &&
         this.element.childNodes[0].data === '';
});

test('cannot overwrite sub-components by setting text', function() {
  this.append(x(y() + z()));
  this.x.foo = this.x.element;
  this.x.update({ foo: 'bar' });

  return this.x.z.element.parentNode == this.x.element;
});

test('update (container) element with text to create a text node only', function() {
  this.update(div('foo'));

  return this.element.firstChild      == this.element.lastChild &&
         this.element.firstChild.data == div('foo');
});

/*

feature('update control text', function(com, test) {
  com.append(x(y()));
  
  test('control with no text', function() {
    com.x.update('foo') == ...
  });
  test('control with only blank text')
  test('control with multiple non-blank text')
  test('control with single non-blank text')
  test('control with single non-blank text and other nodes')
})

*/

test('only update elements with text-only or empty content', function() {
  this.append(x(div('a', div('b'))));
  this.x.update({ a: 'x', b: 'y' });

  return this.x.a.firstChild == this.x.b && 
         this.x.b.firstChild.data == 'y';
});

test('prevent from updating non-default elements that may refer to components', function() {
  this.append(x(y()));
  this.foo = this.x.element;
  this.update({ foo: '...' });
  return this.x.element.firstChild == this.x.y.element;
});

test('handle elements by running callbacks for any top-level components', function() {
  var handledX = false, handledY = false, handledZ = false;
  
  this.insert(x());
  
  this.x.addX = function() { handledX = true };
  this.x.addY = function() { handledY = true };
  this.x.addZ = function() { handledZ = true };
  
  this.x.add(build(div('y z', x())));
  
  return !handledX && handledY && handledZ;
});

test('clone(false) returns a copy of the container element', function() {
  this.append(x(y()));
  this.append(z());
  this.z.append(this.x.clone(false));
  return this.collect('x').length == 2 && this.collect('y').length == 1;
});

test('clone(tree) return a copy of the entire tree', function() {
  this.append(x(y(s('Yip'))));
  this.append(z());
  this.z.append(this.x.clone(true));
  return this.z.x.y.s == 'Yip';
});

test('handle an element with insertion', function() {
  this.insert(x());
  this.x.addY = function(y) { this.append(y) };
  this.x.add(build(y(z())));

  return this.x.y.z.y.x == this.x;
});

test('add and remove flags', function() {
  this.append('<div id="shiny" class="a b x"> </div>');

  if (this.x.shiny)
    return false;

  this.x.apply('shiny');
  this.x.apply('length');
  this.x.apply('foo');
  this.x.apply('foo');
  this.x.apply('bar');
  this.x.clear('bar');
  this.x.clear('bar');
  this.x.clear('b');
  
  this.x.c = this;
  this.x.apply('c');

  return this.x.element.className == 'c foo length shiny a x' && 
         this.x.element.id == 'shiny' &&
         this.x.c == this &&
         this.x.foo === true &&
         this.x.length === true && 
         this.x.shiny === true && 
         this.x.a === true
         this.x.bar === false &&
         this.x.b === false;
});
  
test('setting flags always changes class, but only sets the property if it does not contain an object', function() {
  var o = {};
  
  this.append(x()).apply('foo');
  this.x.foo = o;
  this.x.clear('foo');
  return this.x.foo == o && this.x.element.className == 'x';
});

test('a component can only select one other component at a time', function() {
  this.append(x());
  this.x.append(y());
  this.x.append(z());
  this.select(this.x.y);
  this.select(this.x.z);

  return (this.selected == this.x.z) && !!this.x.z.selected && !this.x.y.selected;
});

test('nested selects', function() {
  this.append(x(y(z())));
  this.x.select(this.x.y);
  this.x.y.select(this.x.y.z);
  this.x.select();
  return !this.x.selected && this.x.y.selected == this.x.y.z;
});

// test('set a container tag', {
//   x: {
//     onClick: function() { this.clicked = true }
//   }
// },
// function() {
//   this.append('<div class="x a"> </div>').setTag('span');
//   this.x.element.onclick();
//   return this.element.getElementsByTagName('span')[0] == this.x.element &&
//          this.x.element.className == 'x a' &&
//          this.a == this.x.element &&
//          this.x.clicked;
// });

test('recognise listeners', {
  z: {
    onclickx:      false,
    onMouseOverX:  function() {},
    _onMouseOverY: function() {}
  }
}, function() {
  var com = this.append(z());
  return !com.matches.x.click && (com.matches.x.mouseover == 'onMouseOverX') && !com.matches.y
});

test('create listeners for default properties (elements and components)', {
  
  a: {
    onClick:    function() {},
    onClickX:   function() {},
    onClickFoo: function() {}
  },
  
  x: {}
  
}, function() {
  this.append(div('a', x() + div('foo') + x()));
  return !!this.a.element.onclick && !!this.a.x.element.onclick && !!this.a.foo.onclick;
});

test('create listeners for properties created during run', {
  
  a: {
    run: function() {
      this.foo = this.element;
      this.bar = this.element;
    },
    
    onMouseOverFoo: function() {},
    onMouseOutBar:  function() {}
  }
  
}, function() {
  this.append(div('a'));
  return !this.a.element.onclick && !!this.a.element.onmouseover && !!this.a.element.onmouseout;
});

test('create listeners for updated properties', {
  x: {
    onClickS: function() { this.clicks = (this.clicks || '') + this.s.toHTML() }
  },
  s: {}
},function() {
  this.append(x(s('a')));
  this.x.s.element.onclick();
  this.x.s.remove();
  this.x.append(s('b'));
  this.x.s.element.onclick();
  this.x.s.remove().element.onclick();
  return this.x.clicks == 'ab';
});

test('fire all listeners in sequence', {
  a: { onClick: function() { this.update(this.toHTML() + 'a') } },
  b: { onClick: function() { this.update(this.toHTML() + 'b') } },
  c: { onClick: function() { this.update(this.toHTML() + 'c') } }
}, function() {
  this.append(div('a b c')).element.onclick();
  return this.a.toHTML() == 'abc';
});

test('listeners and cloned components', {
  x: {
    run:     function() { this.clicks = 0 },
    onClick: function() { this.clicks++ }
  }
}, function() {
  this.append(x());
  this.first('x').element.onclick();
  this.append(this.first('x').clone());
  this.last('x').element.onclick();
  return this.first('x').clicks == 1 && this.last('x').clicks == 1
});