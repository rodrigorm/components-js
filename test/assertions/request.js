assert('GET parameters are appended to URL', function() {
  var req = new Request({}, 'GET', '', { x: 1, y: 2 });
  return (req.query == '') && (req.url == '?x=1&y=2');
});

assert('fake unsupported verbs over POST', function() {
  var req = new Request({}, 'DELETE', '', { x: 1, y: 2 });
  return req.method == 'POST' && req.query == 'x=1&y=2&_method=DELETE' && req.url == '';
});

assert('dispatch error', function() {
  var result = false;
  new Request({ error: function() { result = true }}, 'GET').dispatch(404, '...');
  
  return result;
});

assert('dispatch update', function() {
  var result = false;
  new Request({ update: function() { result = true }}, 'GET').dispatch(200, '...');
  
  return result;
});

assert('dispatch element', function() {
  var result = false;
  new Request({ add: function() { result = true }}, 'GET').dispatch(200, document.createElement('div'));
  
  return result;
});