'use strict';
angular.module('owsWalletApp.pluginModel').factory('AppletSession', function ($rootScope, $log, appletDataService) {

  var self = this;

  var STATE_INITIAL = 0;
  var STATE_VALID = 1;

  var _state = STATE_INITIAL;
  var _applet = null;
  var _userData = {};
  var _publishedKeys = [];

  // Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
  // 
  function AppletSession(applet, callback) {
    if (!applet) {
      throw new Error('Error: no applet provided to create session');
    }
    _applet = applet;
    this.timestamp = new Date();
    this.id = '' + new Date().getTime();
    setState(STATE_VALID);
    return this;
  };

  function setState(state) {
    _state = _state | state;
  };

  function checkStateIsValid(session) {
    if (!session.isValid()) {
      throw new Error('Error: invalid session state, (applet ID = ' + _applet.header.id + ')');
    }
  };

  function doClose(session) {
    // Delete user data.
    session.userData = {};

    // Delete published values.
    for (var i = 0; i < session.publishedKeys.length; i++) {
      delete $rootScope.applet[i];
    }
    setState(~STATE_VALID);
  };

  // Public methods
  //
  AppletSession.prototype.isValid = function() {
    return _state & STATE_VALID;
  };

  AppletSession.prototype.isForApplet = function(appletId) {
    checkStateIsValid(this);
    return _applet.header.id == appletId;
  };

  AppletSession.prototype.getApplet = function() {
    checkStateIsValid(this);
    return _applet;
  };

  AppletSession.prototype.restore = function(callback) {
    checkStateIsValid(this);
    // Restore applet data from storage.
    appletDataService.getData(_applet.header.id, function(err, data) {
      if (err) {
        throw new Error('Error reading applet storage: ' + err.message);
      }
      _userData = data;
      callback(data);
    });
  };

  AppletSession.prototype.get = function(name) {
    checkStateIsValid(this);
    if (!name) {
      throw new Error('Error getting session data, no name specified');
    }
    return _userData[name] || null;
  };

  AppletSession.prototype.set = function(name, value, publish) {
    checkStateIsValid(this);
    if (!name) {
      throw new Error('Error setting session data, no name specified');
    }
    _userData[name] = value || null;

    // Optionally publish the value to root scope.
    if (publish) {
      $rootScope.applet.session = $rootScope.applet.session || {};
      $rootScope.applet.session[name] = value;
      _publishedKeys.push(name);
    }
  };

  AppletSession.prototype.flush = function(callback) {
    checkStateIsValid(this);
    // Write applet data to storage.
    appletDataService.setData(_applet.header.id, _userData, function(err, data) {
      if (err) {
        err = 'Error writing session data: ' + err.message;
      }
      if (callback) {
        callback(err);
      }
    });
  };

  AppletSession.prototype.close = function(flush, callback, force) {
    checkStateIsValid(this);
    if (flush) {
      // Write applet data to storage.
      var self = this;
      appletDataService.setData(_applet.header.id, _userData, function(err, data) {
        var response = null;
        if (err) {
          response = 'Error writing session data: ' + err.message;
          if (force) {
            doClose(self);
          }
        }
        if (callback) {
          callback(response);
        }
      });

    } else {

      doClose(this);
      if (callback) {
        callback(response);
      }
    }
  };

  return AppletSession;
});
