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

test('load HTML to yield components', function() {
  var component = load('<div id="x"></div>');
  return component.name == 'x' && component.element.tagName == 'DIV';
});

test('yield components from both class names and ids', function() {
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

test('precedence is given to the subtree over containers when assigning properties', {
  
  list: {},
  item: {}
}, function() {
  this.insert(div('list', div('item', div('list'))));
  return this.list.item.list != this.list;
});

test('properties are updated after removing a child component', function() {
  this.append(s('one'));
  this.append(s('two'));

  this.s.remove();

  return this.s == 'two';
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
  this.append(x(span('a') + span('b') + y()));
  
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

test('components are accessible as lists', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.append(s('three'));

  return this.s == 'one' &&
         this.s.next() == 'two' &&
         this.s.next().next() == 'three'
         this.s.next().next().prev() == 'two';
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

test('inserting a component moves the component in the tree', function() {
  this.append(x());
  this.append(y());
  this.x.insert(this.y)

  return !!this.x.y.x;
});
       
test('inserting markup returns the first newly created root component', function() {
  return this.append(x(y('...'))).y.x;
});

test('replace container content with text', function() {
  this.append(x());
  
  return this.update('abc').data == 'abc' &&
        !this.x &&
         this.toHTML() == 'abc';
});

test('update text for container elements', function() {
  this.append(x('<span class="a"><span class="b">One</span><span class="c">Two</span></span>'));
  this.x.update({ b: 'One!', c: 'Two!' });

  return this.x.b.innerHTML == 'One!' && this.x.c.innerHTML == 'Two!';
});

test('update with an empty string creates an empty text node', function() {
  return this.update('').nodeType == 3 && !!this.element.firstChild;
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

test('update (control) element with HTML to create a text node only', function() {
  this.append(x(div('foo'))).update({ foo: x() });

  return this.x.foo.firstChild == this.x.foo.lastChild &&
         this.x.foo.firstChild.data       == x();
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

test('flags are unique names prepended to the class name', function() {
  this.insert(x());

  this.x.apply('a');
  this.x.apply('b');
  this.x.apply('b');
  this.x.apply('c');
  this.x.clear('c');
  this.x.clear('c');
  
  return (this.x.element.className == 'b a x') && this.x.a && this.x.b && !this.x.c;
});
  
test('a component can only select one other component at a time', function() {
  this.append(x());
  this.x.append(y());
  this.x.append(z());
  this.select(this.x.y);
  this.select(this.x.z);

  return (this.selected == this.x.z) && !!this.x.z.selected && !this.x.y.selected;
});

// test('set flag for initially-selected component', function() {
//   this.insert(x(div('s', 'one') + div('selected s', 'two') + div('s', 'three')));
//   
//   return this.x.s.next().selected === true;
//   return this.x.selected == this.x.s.next();
// });

test('apply should overwrite the named property if it already exists', function() {
  this.append(x());
  this.x.i = 2;
  this.x.apply('i');
  return this.x.element.className == 'i x' && this.x.i === true;
});

test('clear should remove a class name even if the named property is not a boolean, and overwrite it', function() {
  this.append(x());
  this.x.apply('p');
  this.x.p = 2;
  this.x.clear('p');
  return this.x.element.className == 'x' && this.x.p === false;
});

test('if a component is a selecting another component, and it itself is selected by a component, this.selected accesses the other component rather than being a flag', function() {
  this.append(x(y()));
  this.x.select(this.x.y);
  this.select(this.x);
  this.select();

  return !this.selected && this.x.selected == this.x.y;
});

test('replace a container tag', function() {
  this.append(x(s('a') + y(s('b')) + s('c'))).setTag('p');
  return this.x.element.tagName == 'P' && this.x.collect('s') == 'a,b,c';
});

test('match listeners', function() {
  
  var component = new (Component.extend({
    
    onclickx:      false,
    onMouseOverX:  function() {},
    _onMouseOverY: function() {}
    
  }))(load(x()));
  
  return !component.matches.x.click && (component.matches.x.mouseover == 'onMouseOverX') && !component.matches.y
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

test('fire all listeners in sequence', {
  a: { onClick: function() { this.update(this.toHTML() + 'a') } },
  b: { onClick: function() { this.update(this.toHTML() + 'b') } },
  c: { onClick: function() { this.update(this.toHTML() + 'c') } }
}, function() {
  this.append(div('a b c')).element.onclick();
  return this.a.toHTML() == 'abc';
});

// test('start and stop process', {
//   
//   x: {
//     run: function() {
//       this.i = 0;
//     },
//     
//     inc: function() {
//       if (++this.i == 5)
//         return false;
//     }
//   }
// },function() {
//   this.append(x());
//   this.x.start('inc', 1);
//   return true;
// });