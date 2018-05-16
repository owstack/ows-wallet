'use strict';

angular.module('owsWalletApp.pluginApi').service('start', function($rootScope, platformInfoService) {

	var root = {};

  root.respond = function(message, callback) {
    // Request parameters.
    var data = message.request.data;
    var sessionId = data.sessionId;

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {
        isCordova: platformInfoService.isCordova        
      }
    };

    $rootScope.$emit('Local/PluginStarted', sessionId);

    return callback(message);
  };

  return root;
});
