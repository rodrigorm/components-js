bind('template', {

  spawn: function(name, data) {
    var com = load(this.first(name).element.cloneNode(true));
    com.update(data || '');
    return com;
  }
});