'use strict';

angular.module('owsWalletApp.pluginApi').service('apiService', function($log, $injector, lodash, ApiMessage) {

	var root = {};

  root.init = function(callback) {
    // Start listening for API messages.
    window.addEventListener('message', receiveMessage.bind(this));
    callback();
  };

  function receiveMessage(event) {
    var message = new ApiMessage(event);
    // $log.info('[server] receive  ' + message.header.sequence + ': ' + message.serialize() + ' (from ' + message.event.source.location.toString() + ')');

    if (!lodash.isUndefined(message.route)) {

      // Get the message handler and respond to the client.
      var handler = $injector.get(message.route.handler);
      handler.respond(message, function(message) {
        message.send();
      });

    } else {

      // Respond with errors.
      message.send();
    }
  };

  return root;
});
