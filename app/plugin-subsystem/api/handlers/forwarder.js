'use strict';

angular.module('owsWalletApp.pluginApi').service('forwarder', function(lodash) {

	var root = {};

  root.respond = function(message, callback) {

		if (!message.route.targetId) {
	    message.response = {
	      statusCode: 500,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'Forwarder routing incorrectly configured.'
	      }
	    };
			return callback(message);
		}

		// Resolve the target window. The query string is the plugin's URI.
		// 
		// Example:
		//   document.querySelector('iframe[src*="plugins/@owstack/ows-wallet-servlet-example"]');
		//
		message.route.target = undefined;

		var iframe = document.querySelector('iframe[src*="' + message.route.targetId + '"]');

		if (iframe) {
			message.route.target = iframe.contentWindow;
		}

    if (!message.route.target) {
      message.route.target = message.event.source;

      message.response = {
        statusCode: 404,
        statusText: 'ROUTE_NOT_FOUND',
        data: {
        	message: 'Specified route does not resolve to a target.'
        }
      }
    }

		callback(message);
	};

  return root;
});
