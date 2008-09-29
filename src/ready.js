(function(start) {
  if (/webkit/i.test(navigator.userAgent)) {
    var timeout = setTimeout(function() {
      if (document.readyState == 'loaded' || document.readyState == 'complete' ) {
        start();
      } else {
        setTimeout(arguments.callee, 10);
      }
    }, 10); 
  } else if ((/mozilla/i.test(navigator.userAgent) && !/(compatible)/i.test(navigator.userAgent)) || (/opera/i.test(navigator.userAgent))) {
    document.addEventListener('DOMContentLoaded', start, false);
  } else if (document.uniqueID && document.expando) { // http://www.hedgerwow.com/360/dhtml/ie-dom-ondocumentready.html
    var element = document.createElement('span'); 
  
    (function () { 
      if (document.loaded) return;

      try {
        element.doScroll('left');
      
        if (!document.body)
          throw new Error();
      
        document.loaded = true;
        start();
        element = null; 
      } catch(e) {
        setTimeout(arguments.callee, 0); 
      } 
    })();
  }
})(function() {
  load(document.body);
      
  if (typeof start == 'function')
    start();
});