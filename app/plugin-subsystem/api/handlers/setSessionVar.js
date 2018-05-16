'use strict';

angular.module('owsWalletApp.pluginApi').service('setSessionVar', function(lodash, pluginSessionService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.params.id;
    var name = message.request.params.name;
    var value = message.request.data;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'The request must include a session id.',
	      data: {}
	    };
			return callback(message);
  	}

		// Get the session.
		var session = pluginSessionService.getSession(sessionId);

		if (lodash.isUndefined(session)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'Session not found.',
	      data: {}
	    };
			return callback(message);
		}

		try {

			session.set(name, value);

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {}
	    };

		} catch (error) {

	    message.response = {
	      statusCode: 500,
	      statusText: error.message,
	      data: {}
	    };
		}

		return callback(message);
	};

  return root;
});
