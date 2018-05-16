'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginSessionService', function($log, lodash, PluginSession) {

	var root = {};

  // The plugin session pool keeps track of all sessions created.
  // The active session is expected to be the id of the session associated with the currently running plugin.
	root._sessionPool = [];
  root._activeSessionId = undefined;

  function isActiveSession(sessionId) {
    return (!lodash.isUndefined(root._activeSessionId) && (root._activeSessionId == sessionId));
  };

  function addSession(session) {
    root._sessionPool.push(session);
  };

  function removeSession(session) {
    var existingSessionIndex = lodash.findIndex(root._sessionPool, function(s) {
      return (s.id == session.id);
    });

    var removedSession = lodash.pullAt(root._sessionPool, existingSessionIndex);
    return removedSession[0];
  };

  root.activateSession = function(sessionId) {
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      root._activeSessionId = sessionId;
    } else {
      throw new Error('Failed to activate an invalid or undefined plugin session (id: \'' + sessionId + '\')');
    }
  };

  root.deactivateSession = function(sessionId) {
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      root._activeSessionId = undefined;
    } else {
      throw new Error('Failed to deactivate an invalid or undefined plugin session (id: \'' + sessionId + '\')');
    }
  };

  root.getActiveSession = function() {
    if (!lodash.isUndefined(root._activeSessionId)) {
      return root.getSession(root._activeSessionId);
    } else {
      return undefined;
    }
  };

  root.getSession = function(sessionId) {
    return lodash.find(root._sessionPool, function(session) {
      return (session.id == sessionId);
    });
  };

  root.createSession = function(plugin, callback) {
    var existingSessionIndex = lodash.findIndex(root._sessionPool, function(session) {
      return (session.isForPlugin(plugin.header.id));
    });

    if (existingSessionIndex >= 0) {
    	// Session state error; found an existing session for the plugin.
    	// Quietly remove the existing state.
    	var removedSession = lodash.pullAt(root._sessionPool, existingSessionIndex);
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

    var session = lodash.find(root._sessionPool, function(session) {
      return (session.id == sessionId);
    });

    if (!lodash.isUndefined(session)) {
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
    } else {
    	$log.warn('Plugin session not found for removal: ' + session.id + ' (plugin id: ' + session.plugin.header.id + ')');
	  }
  };

  root.finalize = function() {
    // Deactivate and destroy all sessions.
    try {
      root.deactivateSession(root._activeSessionId);
    } catch(e) {}; // Ignore errors if there is no active session.

    for (var i = 0; i < root._sessionPool.length; i++) {
      root.destroySession(root._sessionPool[i]);
    }
  };

  return root;
});
