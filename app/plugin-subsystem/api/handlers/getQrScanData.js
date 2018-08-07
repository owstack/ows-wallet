'use strict';

angular.module('owsWalletApp.pluginApi').service('getQrScanData', function(lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.params.id;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'The request must include a session id.'
	      }
	    };
			return callback(message);
  	}

  	appletService.scanQrCode(sessionId).then(function(data) {

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: data
	    };

			return callback(message);

  	}).catch(function(error) {

	    message.response = {
	      statusCode: 500,
	      statusText: 'UNEXPECTED_ERROR',
	      data: {
	      	message: error.message
	      }
	    };

			return callback(message);

  	});
	};

  return root;
});
