'use strict';

angular.module('owsWalletApp.pluginApi').service('event', function(lodash, pluginService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var event = message.request.data;

  	if (lodash.isUndefined(event)) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'The request must include event data.'
	      }
	    };
			return callback(message);
  	}

		// Forward this event to all plugins (if any).
		pluginService.broadcastEvent(event);

		// Events do not provide a response.

  };

  return root;
});
