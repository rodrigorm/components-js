var tree;

function bind(name, source) {
  return tree.bind(name, source);
};

function start() {
  tree.load(document.body);
};
    
function build(text) {
  var element, name = (text.match(/<(\w+)\/?[\s|>]/i) || [])[1];

  if (name) {
    name    = name.toLowerCase();
    element = document.createElement('div');
    text    = text.slice(text.indexOf('<'));

    var j = 1;
    while (name = build.Containers[name]) {
      text = '<' + name + '>' + text + '</' + name + '>';
      j++;
    }
    
    element.innerHTML = text;

    for (var i = 0; i < j; i++)
      element = element.firstChild;
    
    element.parentNode.removeChild(element);
  }
  return element;
};

build.Containers = {
  li:    'ul',
  td:    'tr',
  tr:    'tbody',
  tbody: 'table'
};

function extend(object, source) {
  for (var id in source)
    object[id] = source[id];

  if (source.toString != Object.prototype.toString) // force IE to recognise when we override toString
    object.toString = source.toString;

  return object;
}