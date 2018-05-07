'use strict';

angular.module('owsWalletApp.pluginApi').factory('ApiMessage', function ($log, lodash, apiRouter) {

  function ApiMessage(event) {
    var self = this;
    this.event = event;

    try {
      // Check the itegrity of the message event.
      validateEvent();

      var data = JSON.parse(this.event.data);
      lodash.assign(this, data);

      // Check the structure of the request.
      validateRequest();

      // Get our routing.
      this.route = apiRouter.routeRequest(this.request);

      if (lodash.isUndefined(this.route)) {
        this.response  = {
          statusCode: 404,
          statusText: 'Route not found ' + request.method + ' ' + request.url,
          data: {}
        };
        throw new Error();
      }

    } catch (ex) {
      // The message is returned with error status.
      return this;
    }

    // Private methods
    //
    function validateEvent() {
      if (lodash.isUndefined(self.event) || !(self.event instanceof MessageEvent)) {

        // Not a MessageEvent.
        self.response  = {
          statusCode: 500,
          statusText: 'Invalid message event, event is not a MessageEvent.',
          data: {}
        };
        throw new Error();

      } else if(lodash.isUndefined(self.event.data)) {

        // Invalid event.
        self.response  = {
          statusCode: 500,
          statusText: 'Invalid message event, no \'data\' found.',
          data: {}
        };
        throw new Error();

      } else if (!lodash.isString(self.event.data)) {

        // Event data not a string.
        self.response  = {
          statusCode: 500,
          statusText: 'Invalid message event data, expected string argument but received object.',
          data: {}
        };
        throw new Error();
      }
    };

    function validateRequest() {
      if (lodash.isUndefined(self.request)) {

        // No request.
        self.response  = {
          statusCode: 400,
          statusText: 'No request provided.',
          data: {}
        };
        throw new Error();
        
      } else if (lodash.isUndefined(self.request.method)) {

        // No request method.
        self.response  = {
          statusCode: 400,
          statusText: 'No request method specified.',
          data: {}
        };
        throw new Error();
      }

      // Ensure that the specific request method is formed properly.
      switch (self.request.method) {
        case ('GET'):
          break;
        case ('POST'): validatePOST();
          break;
      }
    };

    function validatePOST() {
      // Check for required POST data.
      if (lodash.isUndefined(self.request.data)) {
        // Invalid request; does not match specification.
        self.response  = {
          statusCode: 400,
          statusText: 'Invalid request, POST data not present in request ' + self.request.url + '.',
          data: {}
        };
        throw new Error();
      }
    };

    return this;
  };

  // Private static methods
  //
  function transport(message) {
    return {
      header: message.header,
      request: message.request,
      response: message.response
    }
  };

  // Public methods
  //
  ApiMessage.prototype.send = function() {
    $log.info('[server] RESPONSE ' + this.header.sequence + ': ' + angular.toJson(transport(this)));
    this.event.source.postMessage(angular.toJson(transport(this)), this.event.origin);
  };

  ApiMessage.prototype.serialize = function() {
    return angular.toJson(transport(this));
  };

  return ApiMessage;
});
