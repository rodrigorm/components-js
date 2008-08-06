var Class = {

  create: function(source) {
    function klass() {
      if (this.initialize)
        this.initialize.apply(this, arguments);
    };

    extend(klass.prototype, source || {});

    return klass;
  }
};

function extend(object, source) {
  source = source || {};
  
  for (var id in source)
    object[id] = source[id];

  if (source.toString != Object.prototype.toString) // force IE to recognise when we override toString
    object.toString = source.toString;

  return object;
}