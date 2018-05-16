'use strict';

angular.module('owsWalletApp.pluginApi').service('addRoutes', function(lodash, ApiRouter, pluginSessionService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.params.id;
    var routes = message.request.data.routes;
    var target = message.request.data.target;

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

    ApiRouter.addRoutes(session, routes, target);

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {}
    };

		return callback(message);
	};

  return root;
});
