var Class = {

  create: function(source) {
    function klass() {
      if (this.initialize)
        this.initialize.apply(this, arguments);
    };

    if (source)
      extend(klass.prototype, source);

    return klass;
  }
};