'use strict';

angular.module('owsWalletApp.pluginApi').service('ready', function($rootScope, $log, lodash, servletService, pluginSessionService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var data = message.request.data;
    var sessionId = data.sessionId;

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
	      statusText: 'SESSION_NOT_FOUND',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
		}

		servletService.startServlets(session, { startMode: 'auto' });

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {}
    };

    return callback(message);
  };

  return root;
});
