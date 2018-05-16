'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginSession', function ($rootScope, $log, lodash, PluginState) {

  var STATE_VALID = 1;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function PluginSession(plugin, callback) {
    if (!plugin) {
      throw new Error('No plugin provided to create session');
    }

    var self = this;
    var now = new Date();

    this.id = '' + now.getTime();
    this.timestamp = now;
    this.plugin = plugin;

    var state = STATE_VALID;
    var userData = {};
    var dependentSessions = [];

    /**
     * Priviledged methods
     */

    this.isValid = function() {
      return state & STATE_VALID;
    };

    this.isForPlugin = function(pluginId) {
      checkStateIsValid(this);
      return this.plugin.header.id == pluginId;
    };

    this.restore = function(callback) {
      checkStateIsValid(this);
      // Restore plugin data from storage.
      PluginState.getData(this.plugin.header.id, function(err, data) {
        if (err) {
          throw new Error('Error reading plugin storage: ' + err.message);
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
      return userData[name].value || null;
    };

    // opts = {
    //  transient: <boolean>
    // }
    this.set = function(name, value, opts) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error setting session data, no name specified');
      }
      userData[name] = {
        value: value || null,
        opts: opts
      }
    };

    this.flush = function(callback) {
      checkStateIsValid(this);
      // Write plugin data to storage.
      PluginState.setData(this.plugin.header.id, persistentData(), function(err) {
        if (err) {
          err = 'Error writing session data: ' + err.message;
        }
        if (callback) {
          callback(err);
        }
      });
    };

    this.addDependent = function(session) {
      var index = lodash.findIndex(dependentSessions, function(ds) {
        return ds.id == session.id;
      });

      if (index >= 0) {
        $log.error('Attempt to add duplicate dependent session: ' + session.id);
        return;
      }
      dependentSessions.push(session.id);
    };

    this.removeDependent = function(sessionId) {
      var index = lodash.findIndex(dependentSessions, function(id) {
        return id == sessionId;
      });

      if (index < 0) {
        $log.error('Attempt to remove non-existent dependent session: ' + sessionId);
        return;
      }
      lodash.pullAt(dependentSessions, index);
    };

    this.getDependents = function(kind) {
      return dependentSessions;
    };

    this.close = function(flush, callback, force) {
      checkStateIsValid(this);
      if (flush) {
        this.flush(function(err) {
          if (err && force) {
            doClose();
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
        throw new Error('Invalid session state, (plugin id: ' + this.plugin.header.id + ')');
      }
    };

    function persistentData() {
      lodash.omitBy(userData, function(value, key) {
        if (!value.opts.transient) {
          return {
            value: value
          }
        }
      });
    };

    function doClose() {
      // Delete user data.
      userData = {};

      // Set our state invalid.
      setState(~STATE_VALID);
    };

    return this;
  };

  return PluginSession;
});
