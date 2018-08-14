'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginSessionService', function($log, lodash, PluginSession) {

	var root = {};

  // The plugin session pool keeps track of all sessions created.
  // The active session is expected to be the id of the session associated with the currently running plugin.
	var _sessionPool = [];
  var _activeSessionId = undefined;

  root.activateSession = function(sessionId) {
    $log.info('Activating plugin session (id: \'' + sessionId + '\')');
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      _activeSessionId = sessionId;
    } else {
      $log.warn('Session not found, could not activate plugin session: ' + sessionId);
    }
  };

  root.deactivateSession = function(sessionId) {
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      $log.info('Deactivating plugin session: ' + session.id + ' (plugin id: ' + session.plugin.header.id + ')');

      _activeSessionId = undefined;
    }
  };

  root.getActiveSession = function() {
    if (!lodash.isUndefined(_activeSessionId)) {
      return root.getSession(_activeSessionId);
    } else {
      return undefined;
    }
  };

  root.getSession = function(sessionId) {
    return lodash.find(_sessionPool, function(session) {
      return (session.id == sessionId);
    });
  };

  root.getSessionForPlugin = function(plugin) {
    var sessionIndex = getExistingSessionIndex(plugin);
    if (sessionIndex) {
      return _sessionPool[sessionIndex];
    }
  };

  root.createSession = function(plugin, callback) {
    var existingSessionIndex = getExistingSessionIndex(plugin);

    if (existingSessionIndex >= 0) {
    	// Session state error; found an existing session for the plugin.
    	// Quietly remove the existing state.
    	var removedSession = lodash.pullAt(_sessionPool, existingSessionIndex);
    	removedSession = removedSession[0];
    	$log.warn('Plugin session state inconsistent - forcibly removed session: ' + removedSession.id + ' (plugin id: ' + removedSession.plugin.header.id + ')');
    }

  	// Create a new session.
    var newSession = new PluginSession(plugin);
    newSession.restore(function(data) {
      addSession(newSession);
      callback(newSession);
      $log.debug('Plugin session created: ' + newSession.id + ' (plugin id: ' + newSession.plugin.header.id + ')');
    });
  };

  root.destroySession = function(sessionId, callback) {
    // If the session to destroy is the active session then deactive session before destroying it.
    if (isActiveSession(sessionId)) {
      root.deactivateSession(sessionId);
    }

    var session = lodash.find(_sessionPool, function(session) {
      return (session.id == sessionId);
    });

    if (!lodash.isUndefined(session)) {
      $log.info('Destroying plugin session: ' + session.id + ' (plugin id: ' + session.plugin.header.id + ')');

      // Flush any session data to storage.
    	session.flush(function(err) {
    		if (err) {
		    	$log.debug('Error while writing plugin session data during plugin close: ' + err.message + ' (plugin id: ' + session.plugin.header.id + '), session was closed anyway, session data was lost');
    		}
        // Remove the session from the pool.
        removeSession(session);

	    	$log.debug('Plugin session successfully removed: ' + session.id + ' (plugin id: ' + session.plugin.header.id + ')');
        callback();
    	});
	  }
  };

  // Send event to all plugin sessions.
  root.broadcastEvent = function(event) {
    for (var i = 0; i < _sessionPool.length; i++) {
      _sessionPool[i].notify(event);
    }
  };

  root.finalize = function() {
    // Deactivate and destroy all sessions.
    try {
      root.deactivateSession(_activeSessionId);
    } catch(e) {}; // Ignore errors if there is no active session.

    for (var i = 0; i < _sessionPool.length; i++) {
      root.destroySession(_sessionPool[i].id);
    }
  };

  /**
   * Private functions
   */

  function isActiveSession(sessionId) {
    return (!lodash.isUndefined(_activeSessionId) && (_activeSessionId == sessionId));
  };

  function addSession(session) {
    _sessionPool.push(session);
  };

  function removeSession(session) {
    var existingSessionIndex = lodash.findIndex(_sessionPool, function(s) {
      return (s.id == session.id);
    });

    var removedSession = lodash.pullAt(_sessionPool, existingSessionIndex);
    return removedSession[0];
  };

  function getExistingSessionIndex(plugin) {
    var existingSessionIndex = lodash.findIndex(_sessionPool, function(session) {
      return (session.isForPlugin(plugin.header.id));
    });

    return existingSessionIndex;
  };

  return root;
});
