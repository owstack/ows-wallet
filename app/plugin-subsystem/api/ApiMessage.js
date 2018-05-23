'use strict';

angular.module('owsWalletApp.pluginApi').factory('ApiMessage', function ($rootScope, $log, lodash,  $injector, $timeout, ApiRouter) {

  var REQUEST_TIMEOUT = 3000; // milliseconds

  var sequence = 0;
  var promises = [];

  /**
   * Events
   */

  // When a message is received this listener routes the payload to process the message.
  window.addEventListener('message', receiveMessage.bind(this));

  /**
   * Constructor
   */

  function ApiMessage(eventOrRequest) {
    var self = this;
    this.event = {};

    if (eventOrRequest instanceof MessageEvent) {

      // Construct a message from the event data.
      this.event = eventOrRequest;

      // Check the itegrity of the message event.
      validateEvent();

      // Assign the event message data to this message object.
      var data = JSON.parse(this.event.data);
      lodash.assign(this, data);

      if (isRequest(this)) {
        // Check the structure of the request.
        validateRequest();

        // Get and check our routing.
        this.route = ApiRouter.routeRequest(this.request) || {};
        validateRoute();
      }

    } else {
      var request = eventOrRequest;

      // Set request options per caller or use defaults.
      request.opts = request.opts || {};
      request.opts.timeout = request.opts.timeout || REQUEST_TIMEOUT;

      // Construct a new message from the data and make assignments.
      // 
      // About session id:
      //
      // The header of every message includes the session id of the plugin that sources the message.
      // The session id is also on the iframe src URL.
      // Given the session id from a message header, the source iframe window can be located for postMessage().
      //
      // The session id for the host app is simply 'host' as the host app is the root window; there is no session.
      var now = new Date();
      this.header = {
        sequence: sequence++,
        id: '' + now.getTime(),
        timestamp: now,
        sessionId: 'host'
      };
      this.request = request || {};
      this.response = {};
    }

    /**
     * Private methods
     */

    function validateEvent() {
      if(lodash.isUndefined(self.event.data)) {

        // Invalid event.
        self.response = {
          statusCode: 500,
          statusText: 'MESSAGE_NOT_VALID',
          data: {
            message: 'Invalid message event, no \'data\' found.'
          }
        };

      } else if (!lodash.isString(self.event.data)) {

        // Event data not a string.
        self.response = {
          statusCode: 500,
          statusText: 'MESSAGE_NOT_VALID',
          data: {
            message: 'Invalid message event data, expected string argument but received object.'
          }
        };
      }
    };

    function validateRequest() {
      if (lodash.isUndefined(self.request)) {

        // No request.
        self.response  = {
          statusCode: 400,
          statusText: 'NO_REQUEST',
          data: {
            message: 'No request provided.'
          }
        };
        
      } else if (lodash.isUndefined(self.request.method)) {

        // No request method.
        self.response  = {
          statusCode: 400,
          statusText: 'NO_METHOD',
          data: {
            message: 'No request method specified.'
          }
        };
      }

      // Ensure that the specific request method is formed properly.
      switch (self.request.method) {
        case 'GET':
          break;
        case 'POST': validatePOST();
          break;
        case 'PUT': validatePUT();
          break;
      }
    };

    function validatePOST() {
      // Check for required POST data.
      if (lodash.isUndefined(self.request.data)) {
        // Invalid request; does not match specification.
        self.response  = {
          statusCode: 400,
          statusText: 'REQUEST_NOT_VALID',
          data: {
            message: 'Invalid request, POST data not present in request.'
          }
        };
      }
    };

    function validatePUTT() {
      // Check for required PUT data.
      if (lodash.isUndefined(self.request.data)) {
        // Invalid request; does not match specification.
        self.response  = {
          statusCode: 400,
          statusText: 'REQUEST_NOT_VALID',
          data: {
            message: 'Invalid request, PUT data not present in request.'
          }
        };
      }
    };

    function validateRoute() {
      if (lodash.isEmpty(self.route)) {

        // No route.
        self.response  = {
          statusCode: 404,
          statusText: 'ROUTE_NOT_FOUND',
          data: {
            message: 'Route not found.'
          }
        };
      }
    };

    return this;
  };

  /**
   * Public methods
   */

  ApiMessage.prototype.send = function() {
    var self = this;
    return new Promise(function(resolve, reject) {

      // Handle message response for another target (not me).
      var onForward = function(message) {
        // Forward the response message to the requestor (message source).
        //
        var source = document.querySelector('iframe[src*="' + message.header.sessionId + '"]');

        if (!source || !source.contentWindow) {
          $log.error('[server] ERROR: cannot respond to message requestor, source has disappeared:\nMessage: ' + JSON.stringify(message));
          return;
        }

        // FORWARD RESPONSE MESSAGE
        //
        source.contentWindow.postMessage(angular.toJson(transport(message)), '*');
      };

      // Handle message response for messages targeting me.
      var onComplete = function(message) {
        var responseObj;

        if (message.response.statusCode < 200 || message.response.statusCode > 299) {
          // Fail
          reject({
            code: message.response.statusCode,
            source: message.request.url,
            message: message.response.statusText,
            detail: JSON.stringify(message.response.data)
          });

        } else {

          // Success
          switch (message.response.statusCode) {
            case 204: // No content
              responseObj = undefined;
              break;

            default:
              if (!lodash.isUndefined(message.request.responseObj)) {

                if (lodash.isEmpty(message.request.responseObj)) {
                  // An empty response object informs that we should pass back the raw response data without status.
                  responseObj = message.response.data || {};
                } else {
                  // Create an instance of the promised responseObj with the message data.
                  responseObj = $injector.get(message.request.responseObj);
                  responseObj = eval(new responseObj(message.response.data));              
                }

              } else {
                // Send the plain response object data if no responseObj set.
                // The receiver will have to know how to interpret the object.
                responseObj = message.response;
              }
              break;
          }

          resolve(responseObj);
        }
      };

      if (isRequest(self)) {
        // Set a communication timeout timer unless the caller overrides.
        var timeoutTimer = {};
        if (self.request.opts.timeout > 0) {
          timeoutTimer = $timeout(function() {
            timeout(self);
          }, REQUEST_TIMEOUT);
        }

        // Set the messge completion handler for our request.
        // For requests messages sourced from me use the onComplete() handler.
        // For requests messages sourced from another window use the onForward() handler.
        var onReceived = onComplete;
        if (self.route.handler == 'forwarder') {
          onReceived = onForward;
        }

        // Store the promise callback for execution when a response is received.
        promises.push({
          id: self.header.id,
          onComplete: onReceived,
          timer: timeoutTimer
        });
      }

      if (self.route.targetId) {
        $log.info('[server] FORWARD  ' + self.header.sequence + ': (' + self.route.targetId + ') ' + requestToJson(self));
      } else {
        $log.info('[server] RESPONSE ' + self.header.sequence + ': ' + responseToJson(self));
      }

      // SEND REQUEST MESSAGE
      // This message could be a request from me or the forwarding of a request from another window.
      self.route.target.postMessage(angular.toJson(transport(self)), '*');
    });
  };

  /**
   * Private static methods
   */

  function isRequest(message) {
    return lodash.isEmpty(message.response);
  };

  function receiveMessage(event) {
    var message;

    try {
      message = new ApiMessage(event);

      //$log.info('[client] receive  ' + message.header.sequence + ': ' + serialize(message) + ' (from ' + message.event.source.location.toString() + ')');

      if (isRequest(message)) {
        processRequestMessage(message);

      } else {
        processResponseMessage(message);
      }

    } catch (ex) {

      // Not possible to notify client since the message is invalid.
      // The client will timeout if a valid response is not received.
      $log.error('[server] ERROR: invalid message received, ' + ex.message + ' - '+ angular.toJson(event));
    }
  };

  function processResponseMessage(message) {
    var promiseIndex = lodash.findIndex(promises, function(promise) {
      return promise.id == message.header.id;
    });

    if (promiseIndex >= 0) {
      // Remove the promise from the list.
      // Cancel the timeout timer.
      // Deliver the response to the client.
      var promise = lodash.pullAt(promises, promiseIndex);
      $timeout.cancel(promise[0].timer);
      promise[0].onComplete(message);

    } else {
      // No promise callback, send the message normally.
      // Happens when message construction results in an immediate response.
      message.send();
    }
  };

  function processRequestMessage(message) {
    // Set the default response target. The response to this request will be sent
    // as set here unless it is forwarded by its handler.
    message.route.target = message.event.source;

    // Get the message handler and respond to the client.
    var handler = $injector.get(message.route.handler);
    handler.respond(message, function(message) {
      message.send();
    });
  };

  // Timeout a message waiting for a reponse. Enables the client app to process a message delivery failure.
  function timeout(message) {
    $log.debug('Server request timeout: ' + serialize(message));

    var promiseIndex = lodash.findIndex(promises, function(promise) {
      return promise.id == message.header.id;
    });

    if (promiseIndex >= 0) {
      var promise = lodash.pullAt(promises, promiseIndex);

      message.response = {
        statusCode: 408,
        statusText: 'REQUEST_TIMED_OUT',
        data: {
          message: 'Request timed out.'
        }
      }
      promise[0].onComplete(message);
    } else {
      $log.warn('[server] WARNING: Message request timed out but there is no promise to fulfill: ' + serialize(message));
    }
  };

  function serialize(message) {
    return angular.toJson(transport(message));
  };

  // Only these properties of a message are sent and received.
  function transport(message) {
    return {
      header: message.header,
      request: message.request,
      response: message.response
    }
  };

  function requestToJson(message) {
    var r = {
      header: message.header,
      request: message.request
    };
    return angular.toJson(r);
  };

  // Remove properties that cause circular references.
  function responseToJson(message) {
    var r = {
      header: message.header,
      response: message.response
    };
    if (lodash.get(r.response, 'data.cachedActivity')) {
      r.response = lodash.cloneDeep(r.response);
      delete r.response.data.cachedActivity;
    }
    return angular.toJson(r);
  };

  return ApiMessage;
});
