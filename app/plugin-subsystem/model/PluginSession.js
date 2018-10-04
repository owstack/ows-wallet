'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginSession', function ($rootScope, $log, lodash, PluginState, ApiMessage, configService, utilService) {

  var STATE_VALID = 1;
  var STATE_READY = 2;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function PluginSession(plugin, callback) {
    var config = configService.getSync();

    if (!plugin) {
      throw new Error('No plugin provided to create session');
    }

    var self = this;
    var now = new Date();

    this.id = utilService.uuidv4(); // Session ID
    this.timestamp = now;
    this.plugin = plugin;

    // Use same log level in plugin as for app.
    this.logLevel = config.log.filter;

    var state = STATE_VALID;
    var userData = {};
    var dependentSessions = [];
    var parentSessions = [];

    /**
     * Priviledged methods
     */

    this.setReady = function() {
      setState(STATE_READY);
    };

    this.isReady = function() {
      return (state & STATE_READY) > 0;
    };

    this.isValid = function() {
      return (state & STATE_VALID) > 0;
    };

    this.isForApplet = function() {
      return this.plugin.header.kind == 'applet';
    };

    this.isForServlet = function() {
      return this.plugin.header.kind == 'servlet';
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

        // Expand data from storage into rich objects.
        userData = lodash.mapValues(data, function(value) {
          return {
            value: value,
            opts: {
              transient: false
            }
          }
        });
  
        callback(err, data);
      });
    };

    this.close = function(opts) {
      checkStateIsValid(this);
      this.plugin.close();
    };

    this.getValue = function(name) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error getting session data, no name specified');
      }
      return userData[name] && userData[name].value || null;
    };

    // opts = {
    //  transient: <boolean>
    // }
    this.setValue = function(name, value, opts) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error setting session data, no name specified');
      }

      // Make sure options have values.
      opts = opts || {};
      opts.transient = opts.transient || false;

      userData[name] = {
        value: value || null,
        opts: opts
      }
      return userData[name].value;
    };

    this.removeValue = function(name, callback) {
      checkStateIsValid(this);
      if (!name) {
        throw new Error('Error setting session data, no name specified');
      }

      delete userData[name];

      // Immediate removal of key from storage.
      PluginState.removeData(this.plugin.header.id, name, function(err) {
        if (err) {
          err = 'Error removing session data (' + name + '): ' + err.message;
        }

        if (callback) {
          callback(err);
        }
        $log.info(self.plugin.logId() + ' session data removed from persistent storage (' + name  + ')');
      });
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
        $log.info(self.plugin.logId() + ' session data saved to persistent storage');
      });
    };

    this.addDependent = function(session) {
      var index = lodash.findIndex(dependentSessions, function(ds) {
        return ds.id == session.id;
      });

      if (index >= 0) {
        $log.warn('Attempt to add duplicate dependent session: ' + session.id);
        return;
      }
      dependentSessions.push(session);
    };

    this.removeDependent = function(sessionId) {
      var index = lodash.findIndex(dependentSessions, function(ds) {
        return ds.id == sessionId;
      });

      if (index < 0) {
        $log.warn('Attempt to remove non-existent dependent session: ' + sessionId);
        return;
      }
      lodash.pullAt(dependentSessions, index);
    };

    this.getDependents = function() {
      return dependentSessions;
    };

    this.addParent = function(session) {
      var index = lodash.findIndex(parentSessions, function(ps) {
        return ps.id == session.id;
      });

      if (index >= 0) {
        $log.warn('Attempt to add duplicate parent session: ' + session.id);
        return;
      }
      parentSessions.push(session);
    };

    this.removeParent = function(sessionId) {
      var index = lodash.findIndex(parentSessions, function(ps) {
        return ps.id == sessionId;
      });

      if (index < 0) {
        $log.warn('Attempt to remove non-existent parent session: ' + sessionId);
        return;
      }
      lodash.pullAt(parentSessions, index);
    };

    this.getParents = function() {
      return parentSessions;
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

    this.notify = function(event) {
      sendEvent(this, event);
    };

    this.notifyDependents = function(event) {
      lodash.forEach(dependentSessions, function(session) {
        sendEvent(session, event);
      });
    };

    this.notifyParents = function(event) {
      lodash.forEach(parentSessions, function(session) {
        sendEvent(session, event);
      });
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
      // Return all persistent data.
      var persistent = lodash.pickBy(userData, function(value, key) {
        return value.opts && !value.opts.transient;
      });

      return lodash.mapValues(persistent, function(value) {
        return value.value;
      });

    };

    function sendEvent(session, event) {
      // Events are not sent unless the session is ready (plugin has reported as ready).
      if (!session.isReady()) {
        return Promise.resolve();
      };

      // POST the event to the plugin's event URL.
      var request = {
       method: 'POST',
       url: '/' + session.id,  // Event URL is simply the session id
       data: event
      }

      // Send the message without listening for a response.
      return new ApiMessage(request).send();
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
