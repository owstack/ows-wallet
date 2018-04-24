'use strict';

angular.module('owsWalletApp.pluginApi').service('setAppletProperty', function(lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var appletId = message.request.params.id;
    var name = message.request.params.name;
    var value = message.request.data.value;

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

		// Set the applet property.
		value = applet.property(name, value);

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {
      	value: value
      }
    };
		return callback(message);
	};

  return root;
});
