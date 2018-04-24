'use strict';

angular.module('owsWalletApp.pluginApi').service('start', function() {

	var root = {};

  root.respond = function(message, callback) {
    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {}
    };
    return callback(message);
  };

  return root;
});
