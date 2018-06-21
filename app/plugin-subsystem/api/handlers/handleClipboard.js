'use strict';

angular.module('owsWalletApp.pluginApi').service('handleClipboard', function(platformInfoService, nodeWebkitService, clipboard) {

	var root = {};
  var isCordova = platformInfoService.isCordova;
  var isNW = platformInfoService.isNW;

  root.respond = function(message, callback) {
	  // Request parameters.
    var data = message.request.data;

    if (isCordova) {
      cordova.plugins.clipboard.copy(data);
    } else if (isNW) {
      nodeWebkitService.writeToClipboard(data);
    } else if (clipboard.supported) {
      clipboard.copyText(data);
    } else {
      // No supported
      return;
    }
    
    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: data
    };

		return callback(message);
	};

  return root;
});
