'use strict';

angular.module('owsWalletApp.pluginApi').service('restoreSession', function(lodash, pluginSessionService) {

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

		// Get the session.
		var session = pluginSessionService.getSession(sessionId);

		if (lodash.isUndefined(session)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'SESSON_NOT_FOUND',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
		}

		try {
			session.restore(function(error, data) {
				if (error) {
					throw new Error(error);

				} else {
			    message.response = {
			      statusCode: 200,
			      statusText: 'OK',
			      data: data
			    };
				}
			});

		} catch(error) {
	    message.response = {
	      statusCode: 500,
	      statusText: 'UNEXPECTED_ERROR',
	      data: {
	      	message: error.message
	      }
	    };
		}

		return callback(message);
	};

  return root;
});
