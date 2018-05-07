'use strict';
angular.module('owsWalletApp.pluginModel').factory('AppletSession', function ($rootScope, $log, appletDataService) {

  var STATE_VALID = 1;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function AppletSession(appletObj, callback) {
    if (!appletObj) {
      throw new Error('No applet provided to create session');
    }

    var self = this;
    var now = new Date();

    this.id = '' + now.getTime();
    this.timestamp = now;

    var state = STATE_VALID;
    var applet = appletObj;
    var userData = {};

    /**
     * Priviledged methods
     */

    this.isValid = function() {
      return state & STATE_VALID;
    };

    this.isForApplet = function(appletId) {
      checkStateIsValid(this);
      return applet.header.id == appletId;
    };

    this.getApplet = function() {
      checkStateIsValid(this);
      return applet;
    };

    this.restore = function(callback) {
      checkStateIsValid(this);
      // Restore applet data from storage.
      appletDataService.getData(applet.header.id, function(err, data) {
        if (err) {
          throw new Error('Error reading applet storage: ' + err.message);
        }
        userData = data;
        callback(err, data);
      });
    };

    this.get = function(name) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error getting session data, no name specified');
      }
      return userData[name] || null;
    };

    this.set = function(name, value) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error setting session data, no name specified');
      }
      userData[name] = value || null;
    };

    this.flush = function(callback) {
      checkStateIsValid(this);
      // Write applet data to storage.
      appletDataService.setData(applet.header.id, userData, function(err, data) {
        if (err) {
          err = 'Error writing session data: ' + err.message;
        }
        if (callback) {
          callback(err);
        }
      });
    };

    this.close = function(flush, callback, force) {
      checkStateIsValid(this);
      if (flush) {
        // Write applet data to storage.
        appletDataService.setData(applet.header.id, userData, function(err, data) {
          var response = null;
          if (err) {
            response = 'Error writing session data: ' + err.message;
            if (force) {
              doClose();
            }
          }
          if (callback) {
            callback(response);
          }
        });

      } else {

        doClose();
        if (callback) {
          callback(response);
        }
      }
    };

    /**
     * Private methods
     */

    function setState(stateFlag) {
      state = state | stateFlag;
    };

    function checkStateIsValid(session) {
      if (!session.isValid()) {
        throw new Error('Invalid session state, (applet ID = ' + applet.header.id + ')');
      }
    };

    function doClose() {
      // Delete user data.
      userData = {};

      // Set our state invalid.
      setState(~STATE_VALID);
    };

    return this;
  };

  return AppletSession;
});
