assert('we can build elements from HTML', function() {
  return build('<p></p>').tagName == 'P';
});

assert('we can build orphaned table and list elements from HTML', function() {
  return build('<td></td>').tagName == 'TD' &&
         build('<tr></tr>').tagName == 'TR' &&
         build('<li></li>').tagName == 'LI';
});

assert('loading HTML initializes defined components', function() {
  return load('<div id="x"></div>').element.tagName == 'DIV';
});

assert('a component is identified by either a class name or an id', function() {
  this.append('<span id="x">..</span>');
  this.append('<span class="x">..</span>');
  return this.collect('x').length == 2;
});

assert('cannot remove an id', function() {
  this.append('<span id="x" class="y z">...</span>');
  this.y.container.removeName('z');
  this.y.container.removeName('x');

  return this.y.element.className == 'y' && this.x.element == this.y.element;
});

assert('handle duplicate class names and extraneous whitespace', function() {
  this.append(div(' x x y '));
  return this.x.container.names == 'x,y' && this.collect('x').length == 1;
});

assert('a component has access to containing components', function() {
  return this.insert(x(y(z()))).y.z.y.x.contents == this;
});

assert('a component has access to the first instance of a sub-component', function() {
  this.insert(x(s('a') + s('b')));
  this.insert(s('c'));

  return this.x.s == 'a' &&
         this.s   == 'c' &&
         this.collect('s')   == 'a,b,c' &&
         this.x.collect('s') == 'a,b';
});

assert('precedence is given to the subtree over containers when assigning properties', {
  
  list: {},
  item: {}
}, function() {
  this.insert(div('list', div('item', div('list'))));

  return this.list.item.list != this.list;
});

assert('properties are updated after removing a child component', function() {
  this.append(s('one'));
  this.append(s('two'));

  this.s.remove();

  return this.s == 'two';
});

assert('properties are updated after inserting a component', function() {
  this.append(s('two'));
  this._s = this.s;
  this.insert(s('one'), this.s);

  return this._s == 'two' && this.s == 'one';
});

assert('we can access the first and last descendent component of a given type', function() {
  this.append(x(y(s('one')) + y(z(s('two')))));
  return this.first('s') == 'one' && this.last('s') == 'two';
});

assert('inserting a component in the same position leaves the tree unchanged (using first child)', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.insert(this.s, this.s.next());
  return this.collect('s') == 'one,two';
});

assert('inserting a component in the same position leaves the tree unchanged (using last child)', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.append(this.s.next());
  return this.collect('s') == 'one,two';
});

assert('remove all child instances of a component', function() {
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

assert('remove all sub instances of a component', function() {
  var i = 0;
  
  this.append(x(x(x())));
  this.append(x());

  while (this.x) {
    this.last('x').remove();
    i++;
  }

  return !this.x && i == 4 && this.collect('x').length == 0;
});

assert('append a component that is already the last component but not the last node', function() {
  this.append(div('x', s('one') + s('two') + div('foo')));

  this.x.append(this.x.s.next());
  
  return this.x.element.lastChild == this.x.s.next().element && this.collect('s') == 'one,two';
});

assert('names used by Component are ignored when setting element/component properties', function() {
  this.append(x(div('remove') + div('container a')));
  return (typeof this.x.remove == 'function') && (this.x.a != this.x.container);
});

assert('update containers after a removal', function() {
  this.append(x(y(z())));      
  this.append(this.x.y);

  return this.y.z && this.y.contents && !this.y.x;
});

assert('components are accessible as lists', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.append(s('three'));

  return this.s == 'one' &&
         this.s.next() == 'two' &&
         this.s.next().next() == 'three'
         this.s.next().next().prev() == 'two';
});

assert('lists are updated after inserting a new component', function() {
  this.append(s('one'));
  this.append(x());
  this.x.append(s('two'))
  this.append(s('three'));

  return this.collect('s') == 'one,two,three';
});

assert('the whole tree is accessible when a component run', {
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

assert('every component is run exactly once', {
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

assert('inserting a component moves the component in the tree', function() {
  this.append(x());
  this.append(y());
  this.x.insert(this.y)

  return !!this.x.y.x;
});
       
assert('inserting markup returns the first newly created root component', function() {
  return this.append(x(y('...'))).y.x.contents == this;
});

assert('replace container content with text', function() {
  this.append(x());
  
  return this.update('abc').data == 'abc' &&
        !this.x &&
         this.getHTML() == 'abc';
});

assert('update text for container elements', function() {
  this.append(x('<span class="a"><span class="b">One</span><span class="c">Two</span></span>'));
  this.x.update({ b: 'One!', c: 'Two!' });

  return this.x.b.innerHTML == 'One!' && this.x.c.innerHTML == 'Two!';
}),

assert('cannot overwrite sub-components by setting text', function() {
  this.append(x(y() + z()));
  this.x.foo = this.x.element;
  this.x.update({ foo: 'bar' });
  return this.x.getHTML() == y() + z();
});

assert('each() is safe for iterations during which sub containers are removed', function() {
  this.append(s('one'));
  this.append(s('two'));
  this.append(s('three'));

  this.each('s', function() {
    this.remove();
  });
  
  return this.collect('s').length == 0;
});

assert('handle elements by running callbacks for any top-level components', function() {
  var handledX = false, handledY = false, handledZ = false;
  
  this.insert(x());
  
  this.x.addX = function() { handledX = true };
  this.x.addY = function() { handledY = true };
  this.x.addZ = function() { handledZ = true };
  
  this.x.add(build(div('y z', x())));
  
  return !handledX && handledY && handledZ;
});

assert('clone(false) returns a copy of the container element', function() {
  this.append(x(y()));
  this.append(z());
  this.z.append(this.x.clone(false));
  return this.collect('x').length == 2 && this.collect('y').length == 1;
});

assert('clone(tree) return a copy of the entire tree', function() {
  this.append(x(y(s('Yip'))));
  this.append(z());
  this.z.append(this.x.clone(true));
  return this.z.x.y.s == 'Yip';
});

assert('handle an element with insertion', function() {
  this.insert(x());
  this.x.addY = function(y) { this.append(y) };
  this.x.add(build(y(z())));

  return this.x.y.z.y.x == this.x;
});

assert('appropriately named methods are automatically registered as event listeners', function() {
  
  var component = new (Component.extend({
    
    onclickx:      false,
    onMouseOverX:  function() {},
    _onMouseOverY: function() {}
    
  }))(load(x()));
  
  return !component.matches.x.click && (component.matches.x.mouseover == 'onMouseOverX') && !component.matches.y
});

assert('listeners are registered after a component or element property is set', function() {
  
  var component = new (Component.extend({    
    onClickY: function() {}
  }))(load(x()));
  
  return !component.listeners.y && 
       !!(component.set('y', this)) && 
       !!component.listeners.y.click &&
       !(component.unset('y')) &&
        !component.listeners.y.click;
});

assert('flags are unique names prepended to the class name', function() {
  this.insert(x());

  this.x.apply('a');
  this.x.apply('b');
  this.x.apply('b');
  this.x.apply('c');
  this.x.clear('c');
  this.x.clear('c');
  
  return (this.x.element.className == 'b a x') && this.x.a && this.x.b && !this.x.c;
});
  
assert('a component can only select one other component at a time', function() {
  this.append(x());
  this.x.append(y());
  this.x.append(z());
  this.select(this.x.y);
  this.select(this.x.z);

  return (this.selected == this.x.z) && !!this.x.z.selected && !this.x.y.selected;
});

// assert('set flag for initially-selected component', function() {
//   this.insert(x(div('s', 'one') + div('selected s', 'two') + div('s', 'three')));
//   
//   return this.x.s.next().selected === true;
//   return this.x.selected == this.x.s.next();
// });

assert('apply should overwrite the named property if it already exists', function() {
  this.append(x());
  this.x.i = 2;
  this.x.apply('i');
  return this.x.element.className == 'i x' && this.x.i === true;
});

assert('clear should remove a class name even if the named property is not a boolean, and overwrite it', function() {
  this.append(x());
  this.x.apply('p');
  this.x.p = 2;
  this.x.clear('p');
  return this.x.element.className == 'x' && this.x.p === false;
});

assert('if a component is a selecting another component, and it itself is selected by a component, this.selected accesses the other component rather than being a flag', function() {
  this.append(x(y()));
  this.x.select(this.x.y);
  this.select(this.x);
  this.select();

  return !this.selected && this.x.selected == this.x.y;
});

assert('replace a container tag', function() {
  this.append(x(s('a') + y(s('b')) + s('c'))).setTag('p');
  return this.x.element.tagName == 'P' && this.x.collect('s') == 'a,b,c';
});

bind('x');
bind('y');
bind('z');
bind('s', {
  toString: function() {
    return this.element.innerHTML;
  }
});

function s(content) { return div('s', content) }
function x(content) { return div('x', content) }
function y(content) { return div('y', content) }
function z(content) { return div('z', content) }
function div(name, content) {
  return '<div class="' + name + '">' + (content || '') + '</div>';
}