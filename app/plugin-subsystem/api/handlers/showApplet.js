'use strict';

angular.module('owsWalletApp.pluginApi').service('showApplet', function($rootScope, lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
    // Request parameters.
    var sessionId = message.request.data.sessionId;

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

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {}
    };

    $rootScope.$emit('Local/ShowApplet', sessionId);

    return callback(message);
  };

  return root;
});
