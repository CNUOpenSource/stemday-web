#!/bin/env node

/**
* Provided under the MIT License (c) 2014
* See LICENSE @file for details.
*
* @file server.js
*
* @author juanvallejo
* @date 1/22/15
*
* Small server application written in javascript to test the hosting of stem day website and signup forms.
* Can be used for pretty much any app though.
*
**/

// declare application constants

var SERVER_HOST 			= process.env.OPENSHIFT_NODEJS_IP 	|| '0.0.0.0';
var SERVER_PORT				= process.env.OPENSHIFT_NODEJS_PORT || 8000;
var SERVER_HEAD_OK			= 200;
var SERVER_HEAD_NOTFOUND 	= 404;
var SERVER_HEAD_ERROR 		= 500;
var SERVER_RES_OK 			= '200. Server status: OK';
var SERVER_RES_NOTFOUND		= '404. The file you are looking for could not be found.';
var SERVER_RES_ERROR 		= '500. An invalid request was sent to the server.';

// import node.js packages

var fs 				= require('fs');
var http 			= require('http');
var https 			= require('https');
var url 			= require('url');

// begin application declarations

var application		= null;				// holds our main application server. Initialized in main
var currentRequest 	= null;				// define current parsed / routed request being handled

var dictionaryOfMimeTypes = {

	'css' 	: 'text/css' 				,
	'html' 	: 'text/html' 				,
	'ico' 	: 'image/x-icon'			,
	'jpg' 	: 'image/jpeg'				,
	'jpeg' 	: 'image/jpeg' 				,
	'js' 	: 'application/javascript' 	,
	'map' 	: 'application/x-navimap'	,
	'pdf' 	: 'application/pdf' 		,
	'png' 	: 'image/png'				,
	'txt' 	: 'text/plain'

};

var dictionaryOfRoutes 	= {

	'/'  							: 'index.html' 						,
	'/register/exhibitor' 			: 'exhibitor-registration.html' 	,
	'/register/participant' 		: 'participant-registration.html'	,
	'/register/exhibitor/success'	: 'successful-registration.html'	,
	'/register/participant/success' : 'successful-registration.html'

};

// declare functions and methodical procedures

/**
 * Checks all incoming requests to see if routing is applicable to them.
 *
 * @return {String} routedRequest
 */
function requestRouter(request, response) {

	var requestURL = request.url;
 
	// modify font requests that have queries in url
	if(requestURL.match(/\.(.*)(\?)/gi)) {
		requestURL = requestURL.split('?')[0];
	}
 
	// return default request by default
	var requestToHandle	= requestURL;
	var routedRequest 	= requestURL;
 
	if(dictionaryOfRoutes.hasOwnProperty(requestToHandle)) {
		routedRequest = dictionaryOfRoutes[requestToHandle];
	}
 
	return routedRequest;

}

/**
 * Checks passed requests for a defined file Mime Type.
 *
 * @return {String} requestMimeType		a file mimetype of current request if defined, or a default .txt mime type 
 * 										if request's mime type is not defined
 */
function mimeTypeParser(request, response) {

	var requestToHandle 		= requestRouter(request, response);
	var requestMimeType 		= dictionaryOfMimeTypes['txt'];

	// retrieve file extension from current request by grabbing
	// suffix after last period of request string
	var requestFileExtension	= requestToHandle.split('.');
	requestFileExtension 		= requestFileExtension[requestFileExtension.length - 1];
	requestFileExtension 		= requestFileExtension.split('&')[0];

	if(dictionaryOfMimeTypes.hasOwnProperty(requestFileExtension)) {
		requestMimeType = dictionaryOfMimeTypes[requestFileExtension];
	}

	return requestMimeType;
}

/**
 * Serves current request as a stream from a file on the server
 */
function handleRequestAsFileStream(request, response) {

	var requestToHandle = requestRouter(request, response);

	fs.readFile(__dirname + '/' + requestToHandle, function(error, data) {

		if(error) {

			console.log('File ' + requestToHandle + ' could not be served -> ' + error);
			
			response.writeHead(SERVER_HEAD_NOTFOUND);
			response.end(SERVER_RES_NOTFOUND);
		}

		response.writeHead(SERVER_HEAD_OK, {
			'Content-Type' : mimeTypeParser(request, response)
		});

		response.end(data);

	});

}

/**
 * Serves current request along with data from a specified api uri
 */
function handleRequestAsAPICall(request, response) {

	var APIURI 			= request.url.split('/api/')[1];
	var APIResponseData = '';

	if(APIURI == '') {
		response.writeHead(SERVER_HEAD_ERROR);
		return response.end(SERVER_RES_ERROR);
	}

	https.get(APIURI, function(APIResponse) {

		APIResponse.on('data', function(chunk) {
			APIResponseData += chunk;
		});

		APIResponse.on('end', function() {
			response.writeHead(SERVER_HEAD_OK);
			response.end(APIResponseData);
		});

	}).on('error', function(error) {
		console.log('<HTTP.Get> ' + error.message);
		response.writeHead(SERVER_HEAD_ERROR);
		response.end(APIURI);
	});

}

/**
 * POSTs current api request to endpoint uri and returns response to client
 */
function handleRequestAsAPIPOSTCall(request, response) {

	var APIURI 				= request.url.split('/api/post/')[1];
	var URIComponents		= url.parse(APIURI);
	var POSTDataFromClient 	= '';
	var APIResponseData 	= '';

	if(APIURI == '') {
		response.writeHead(SERVER_HEAD_ERROR);
		return response.end(SERVER_RES_ERROR);
	}

	// receive data to relay from client
	request.on('data', function(chunk) {
		POSTDataFromClient += chunk;
	});

	request.on('end', function() {

		var APIPostRequest = https.request({

			host 	: URIComponents.host,
			path 	: URIComponents.path,
			href 	: URIComponents.href,
			method 	: 'POST',
			headers : {
				'Content-Type' : request.headers['content-type']
			}

		}, function(APIResponse) {

			APIResponse.on('data', function(chunk) {
				APIResponseData += chunk;
			});

			APIResponse.on('end', function() {

				response.writeHead(SERVER_HEAD_OK, {
					'Content-Type' : 'text/html',
				});

				console.log(APIResponseData);
				response.end(APIResponseData);

			});

		}).end(POSTDataFromClient);

	});
}

/**
 * handle all initial application requests, assign routes, etc.
 */
function mainRequestHandler(request, response) {

		// assign global definition for current request being handled
		currentRequest = requestRouter(request, response);

		if(currentRequest.match(/^\/test(\/)?$/gi)) {
			response.writeHead(SERVER_HEAD_OK);
			response.end(SERVER_RES_OK);
		} else if(currentRequest.match(/^\/api\/post\/(.*)/gi)) {
			handleRequestAsAPIPOSTCall(request, response);
		} else if(currentRequest.match(/^\/api\/(.*)/gi)) {
			handleRequestAsAPICall(request, response);
		} else {
			handleRequestAsFileStream(request, response);
		}
}

// initialize application
(function main(application) {

	// define global application server and bind to a specified port
	application = http.createServer(mainRequestHandler);
	application.listen(SERVER_PORT, SERVER_HOST);

})(application);
