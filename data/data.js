/**
 * juanvallejo
 * @version 1.0
 */
window.onload = function() {
	//slider logic
	var slider = {
		control:document.getElementsByClassName('carousel-control'),
		self:document.getElementById('carousel-slides'),
		transition:{
			delay:8000,
			on:true,
			speed:'slow',
			type:'default',
			busy:false
		},
		errors:[],
		slides:[],
		processed:0,
		size:8,
		slide:{
			current:0,
			add:function(amount,callback) {
				if(typeof amount == 'function') {
					callback = amount;
					amount = null;
				}

				if(amount > 0 || amount === null) {
					var slide = document.createElement('div');
					slide.style.cssFloat = 'left';
					slide.add = function(error) {
						this.className = 'item'+(this.id == slider.slide.current ? ' active' : '');

						var container = document.createElement('div');
						container.className = 'container';

						var caption = document.createElement('div');
						caption.className = 'carousel-caption';

						if(!error) slider.slides.push(this);
						else {
							slider.errors.push(error);
						}

						if(amount && amount-1 > 0) slider.slide.add(amount-1,callback);
						else callback.call(this,error,slider.slides);
					};

					var img = new Image();
					img.src = 'img/thumbs/'+(++slider.processed)+'.jpg';
					img.addEventListener('load',function() {
						this.className = 'img-responsive';
						slide.id = slider.slides.length;
						slide.appendChild(this);
						slide.add();
					});
					img.addEventListener('error',function(e) {
						slide.add('There was an error adding this image to the slider array.');
					});
				}
			},
			next:function() {
				if(!slider.transition.busy) {
					slider.transition.busy = true;
					var current = slider.self.children[slider.slide.current];
					$(current).fadeOut(slider.transition.speed,function() {
						if(slider.slide.current >= slider.slides.length-1) {
							slider.slide.current = -1;
						}

						var next = slider.self.children[++slider.slide.current];
						$(next).fadeIn(slider.transition.speed,function() {
							slider.transition.busy = false;
						});

					});
				}
			},
			previous:function() {
				if(!slider.transition.busy) {
					slider.transition.busy = true;
					var current = slider.self.children[slider.slide.current];
					$(current).fadeOut(slider.transition.speed,function() {
						if(slider.slide.current <= 0) {
							slider.slide.current = slider.slides.length;
						}

						var next = slider.self.children[--slider.slide.current];
						$(next).fadeIn(slider.transition.speed,function() {
							slider.transition.busy = false;
						});
					});
				}
			},
			remove:function(index) {

			}
		},
		init:function() {
			var self = this;

			if(!self.self) return console.log("Slider wrapper not implemented.");

			self.slide.current = parseInt(Math.random()*(self.size));

			self.slide.add(self.size,function(err,slides) {
				slides.forEach(function(slide) {
					slider.self.appendChild(slide);
				});
			});

			slider.control[0].addEventListener('click',function() {
				if(slider.transition.on) slider.transition.on = false;
				slider.slide.previous();
			});
			slider.control[1].addEventListener('click',function() {
				if(slider.transition.on) slider.transition.on = false;
				slider.slide.next();
			});

			(function ticker() {
				if(slider.transition.on) {
					var interval = setTimeout(function() {
						slider.slide.next();
						ticker();
					},slider.transition.delay);
				}
			})();
		}
	};

	//make page slide to local link (hashtag) instead of jumping
	var a = document.getElementsByTagName('a');
	var triggs = ['#register'];

	for(var i=0;i<a.length;i++) {
		a[i].addEventListener('click',function(e) {
			var attr = this.getAttribute('href');
			if(triggs.indexOf(attr) != -1) {
				e.preventDefault();
				$('html,body').animate({scrollTop:$(attr).offset().top},1000);
			}
		});
	}

	//init slider
	slider.init();
};