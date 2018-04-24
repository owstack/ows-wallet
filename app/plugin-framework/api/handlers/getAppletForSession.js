'use strict';

angular.module('owsWalletApp.pluginApi').service('getAppletForSession', function(lodash, appletSessionService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.params.id;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'The request must include a session id.',
	      data: {}
	    };
			return callback(message);
  	}

		// Get the session.
		var session = appletSessionService.getSession(sessionId);

		if (lodash.isUndefined(session)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'Session not found.',
	      data: {}
	    };
			return callback(message);
		}

		try {
  		// Get the applet.
			var applet = session.getApplet();
	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {
	      	obj: applet
	      }
	    };
			return callback(message);

		} catch(ex) {
	    message.response = {
	      statusCode: 500,
	      statusText: ex.message,
	      data: {}
	    };
			return callback(message);
		}
	};

  return root;
});
