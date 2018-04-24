'use strict';

angular.module('owsWalletApp.pluginApi').service('callService', function(lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var appletId = message.request.params.id;
    var pluginId = message.request.params.pluginId;
    var fn = message.request.params.fn;
    var args = message.request.data.args;

  	if (lodash.isUndefined(appletId) || appletId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'The request must include an applet id.',
	      data: {}
	    };
			return callback(message);
  	}

		// Get the applet.
		var applet = appletService.getAppletWithStateById(appletId);

		if (lodash.isUndefined(applet)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'Applet not found.',
	      data: {}
	    };
			return callback(message);
		}

		// Run the service function via the applet service delegate.
		try {
			var serviceDelegate = applet.getServiceDelegate(pluginId);
			var result = serviceDelegate.call(fn, args);

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {
	      	result: result
	      }
	    };
		} catch (ex) {

	    message.response = {
	      statusCode: 500,
	      statusText: ex.message,
	      data: {}
	    };
		}

		return callback(message);
	};

  return root;
});
