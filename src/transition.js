var Transition = Class.create({
  
  initialize: function(element, i, j, duration, setStyle, finalize) {
    this.element  = element;
    this.i = i;
    this.k = i;
    this.j = j;
    this.duration = duration;
    this.setStyle = setStyle;
    this.finalize = finalize;
    
    this.startAt = this.getTime();
    this.endAt   = this.startAt + this.duration;
    
    // Trigger hasLayout in IE (fixes text rendering bug)
    if (this.element.currentStyle)
      this.element.style.width = this.element.offsetWidth + 'px';
    
    this.setStyle(this.i);
    this.setInterval();
  },
  
  setInterval: function() {
    var transition = this;
    
    this.interval  = setInterval(function() {
      transition.onInterval();
    }, Math.round(1000 / Transition.rate));
  },
  
  onInterval: function() {
    this.progress = (this.getTime() - this.startAt) / this.duration;
    
    if (this.progress <= 1) {
      this.progress = -1 * (Math.cos(Math.PI* this.progress) - 1) / 2;
      
      this.setStyle(this.i + ((this.j - this.i) * this.progress));
    } else {
      this.setStyle(this.j);
      clearInterval(this.interval);
      
      if (this.element.currentStyle)
        this.element.style.width = '';
      
      if (this.finalize)
        this.finalize();
    }
  },
  
  getK: function() {
    var progress = (this.time - this.startAt) / duration;
    
    return this.i + ((this.j - this.i) * (this.endAt - this.time));
  },
  
  getTime: function() {
    return new Date().getTime();
  }
});

Transition.rate = 50;