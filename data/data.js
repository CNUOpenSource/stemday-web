/**
 * juanvallejo
 * @version 1.0
 */

// define application constants

var DEBUG_MODE                  = false;
var INPUT_INFORMATION_REQUIRED  = 'This information is required.';

// polyfill for IE
if(typeof console == 'undefined' || typeof console.log == 'undefined') {
	var console = {
		log:function(text) {
			// alert(text);
		}
	}
}

if(window.location.hostname == 'localhost') {
	// console.log('DEBUG MODE');
	DEBUG_MODE = true;
}

// define google drive functions

// define Google Docs API variables and settings
var GoogleDocs = {

    useNodeServerAPICalls   : true,

    APIVersion              : '3.0',
    APIKey                  : 'AIzaSyBh8KtwWGuG2zGq3eRLX-mdjLQJeo8IXeY',
    APIEndpoint             : 'https://www.googleapis.com/drive/v2/',
    APISpreadsheetsEndpoint : 'https://spreadsheets.google.com/feeds/list/',
    APIEntryContentType     : 'application/atom+xml',
    APIScriptsEndpoint      : 'https://script.google.com/a/macros/cnu.edu/s/',

    defaultScriptID         : 'AKfycbzUCfwk5WF6qlpRYQbCWPlOzouz2ZTHk6nmE-o2ZDw',
    defaultSpreadSheetId    : '1OeO8BrZ6BlhA2AwoMpmWj_RIh1wGtCeyEFJWgpU9Hts',

    OAuthEnpoint            : 'https://www.googleapis.com/auth/devstorage.read_write'

};

// define Google Docs API methods

/**
 * retrieves a document from Google Docs using its ID.
 * if no ID is given, GoogleDocs.spreadsheetId is used.
 *
 * @param method    {String} id of google docs file
 * @param uri       {String} endpoint url where the request should be made
 * @param callback  {Function} function to be called after response is received
 */
GoogleDocs.httpRequest      = function(method, uri, callback) {

	// this should point to external, accessible location while in production
	var apiProductionModifier = '';

	if(!DEBUG_MODE) {
		apiProductionModifier = 'http://stemday.cnuapps.me';
	}

    if(!callback || typeof callback != 'function') {
        callback = function() {};
    }

    if(GoogleDocs.useNodeServerAPICalls) {
        uri = apiProductionModifier + '/api/' + uri;
    }

    // check to see if IE 9 is being used
	if(navigator.userAgent.indexOf("MSIE ") != -1) {

		// console.log('Internet Explorer detected.' + uri);
		$.ajax({
			url: uri + '&jsoncallback=iejsoncallback',
			dataType: 'jsonp',
			success: function(response) {
				callback.call(this, null, response);
			},
			error: function(response) {
				callback.call(this, null, response);
			}
		});

		function iejsoncallback(response) {}

	} else {

	    // create a new asynchronous http request object
	    var http = new XMLHttpRequest();
	    http.open(method, uri, true);
	    http.send(null);

	    http.addEventListener('readystatechange', function() {
	        
	        if(this.readyState == 4) {
	            if(this.status == 200) {
	                // send response to callee
	                callback.call(this, null, this.responseText);
	            } else {
	                // send error to callee
	                callback.call(this, this.responseText);
	            }
	        }

	    });

	}

}

/**
 * retrieves a document from Google Docs using its ID.
 * if no ID is given, GoogleDocs.spreadsheetId is used.
 *
 * @param fileID    {String}    id of google docs file
 * @param callback  {Function}  function to be called after response is received
 */
GoogleDocs.getFileMetaData  = function(fileID, callback) {

    if(!fileID) {
        fileID = GoogleDocs.defaultSpreadSheetId;
    }

    // handle case where only a callback function is passed
    if(typeof fileID == 'function') {
        callback    = fileID;
        fileID      = GoogleDocs.defaultSpreadSheetId;
    }

    // create new http request
    GoogleDocs.httpRequest('GET', GoogleDocs.APIEndpoint + 'files/' + fileID + '?key=' + GoogleDocs.APIKey + '&v=' + GoogleDocs.APIVersion, callback);

}

/**
 * retrieves (cell) contents of a spreadsheet document from Google Docs using its ID.
 * if no ID is given, GoogleDocs.spreadsheetId is used.
 *
 * @param fileID    {String}    id of google docs file
 * @param callback  {Function}  function to be called after response is received
 */
GoogleDocs.getSpreadsheetCells = function(fileID, callback) {

    if(!fileID) {
        fileID = GoogleDocs.defaultSpreadSheetId;
    }

    // handle case where only a callback function is passed
    if(typeof fileID == 'function') {
        callback    = fileID;
        fileID      = GoogleDocs.defaultSpreadSheetId;
    }

    GoogleDocs.httpRequest('GET', GoogleDocs.APISpreadsheetsEndpoint + fileID + '/od6/public/full?alt=json', callback);

}

GoogleDocs.putSpreadsheetRow = function(fileID, rowContentObject, callback) {

    // {row1Title:row1Content, row2Title:row2Content, ...}
    var parameters = '';

    if(!fileID) {
        fileID = GoogleDocs.defaultScriptID;
    }

    // handle case where only a callback function is passed
    if(typeof fileID == 'function') {
        callback    = fileID;
        fileID      = GoogleDocs.defaultScriptID;
    }

    // handle case where an object with parameters is passed
    if(typeof fileID == 'object' && typeof rowContentObject == 'function') {

        callback            = rowContentObject;
        rowContentObject    = fileID;
        fileID              = GoogleDocs.defaultScriptID;

    }

    parameters = '?';

    for(var i in rowContentObject) {
		parameters += i + '=' + rowContentObject[i] + '&';
	}

	// remove last '&' symbol from parameters
	parameters = parameters.substring(0, parameters.length - 1);

    GoogleDocs.httpRequest('GET', GoogleDocs.APIScriptsEndpoint + fileID + '/exec' + parameters, callback);

}

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
		size:9,
		slide:{
			current:0,
			add:function(amount, callback) {
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

						if(amount && amount-1 > 0) slider.slide.add(amount-1, callback);
						else callback.call(this,error,slider.slides);
					};

					var img = new Image();
					img.src = 'img/thumbs/' + (++slider.processed) + '.jpg';
					img.addEventListener('load', function() {
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

			// define scope
			var self = this;

			if(!self.self) {
				return;
				// return console.log("Slider wrapper not implemented.");
			}

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

			// timeout count
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
