function span(names, content) {
  return tag('span', names, content);
}

function div(names, content) {
  return tag('div', names, content);
}

function tag(name, names, content) {
  return '<' + name + (names ? ' class="' + names + '"': '') + '>' + (content || '') + '</' + name + '>';
}