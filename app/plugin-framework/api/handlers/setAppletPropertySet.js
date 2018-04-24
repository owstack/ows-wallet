'use strict';

angular.module('owsWalletApp.pluginApi').service('setAppletPropertySet', function(lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var appletId = message.request.params.id;
    var set = message.request.data.set;

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

		var values = {};

		if (set instanceof Array) {
			// Return the values of each property in the set.
			for (var i = 0; i < set.length; i++) {
				values[name] = applet.property(name);
			}
		} else {
			// Set each property value.
			for (var name in set) {
			  if (set.hasOwnProperty(name)) {
			    values[name] = applet.property(name, set[name]);
			  } 
			}
		}

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {
      	values: values
      }
    };
		return callback(message);
	};

  return root;
});
