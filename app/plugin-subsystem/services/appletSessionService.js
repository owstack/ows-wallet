'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletSessionService', function($log, lodash, AppletSession) {

	var root = {};

  // The applet session pool keeps track of all sessions created.
  // The active session is expected to be the id of the session associated with the currently running applet.
	root._appletSessionPool = [];
  root._activeSessionId = undefined;

  function isActiveSession(sessionId) {
    return (!lodash.isUndefined(root._activeSessionId) && (root._activeSessionId == sessionId));
  };

  function addSession(session) {
    root._appletSessionPool.push(session);
  };

  function removeSession(session) {
    var existingSessionIndex = lodash.findIndex(root._appletSessionPool, function(s) {
      return (s.id == session.id);
    });

    var removedSession = lodash.pullAt(root._appletSessionPool, existingSessionIndex);
    return removedSession[0];
  };

  root.activateSession = function(sessionId) {
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      root._activeSessionId = sessionId;
    } else {
      throw new Error('Error: failed to activate an invalid or undefined applet session (id: \'' + sessionId + '\')');
    }
  };

  root.deactivateSession = function(sessionId) {
    var session = root.getSession(sessionId)
    if (!lodash.isUndefined(session) && session.isValid()) {
      root._activeSessionId = undefined;
    } else {
      throw new Error('Error: failed to deactivate an invalid or undefined applet session (id: \'' + sessionId + '\')');
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
    return lodash.find(root._appletSessionPool, function(session) {
      return (session.id == sessionId);
    });
  };

  root.createSession = function(applet, callback) {
    var existingSessionIndex = lodash.findIndex(root._appletSessionPool, function(session) {
      return (session.isForApplet(applet.header.id));
    });

    if (existingSessionIndex >= 0) {
    	// Session state error; found an existing session for the applet.
    	// Quietly remove the existing state.
    	var removedSession = lodash.pullAt(root._appletSessionPool, existingSessionIndex);
    	removedSession = removedSession[0];
    	$log.debug('Applet session state error - forcibly removed session: ' + removedSession.id + ' (applet ID: ' + removedSession.getApplet().header.id + ')');
    }

  	// Create a new session.
    var newSession = new AppletSession(applet);
    newSession.restore(function(data) {
      addSession(newSession);
      callback(newSession);
      $log.debug('Applet session created: ' + newSession.id + ' (applet ID: ' + newSession.getApplet().header.id + ')');
    });
  };

  root.destroySession = function(sessionId) {
    // If the session to destroy is the active session then deactive session before destroying it.
    if (isActiveSession(sessionId)) {
      root.deactivateSession(sessionId);
    }

    var session = lodash.find(root._appletSessionPool, function(session) {
      return (session.id == sessionId);
    });

    if (!lodash.isUndefined(session)) {
      // Flush any session data to storage.
    	session.flush(function(err, data) {
    		if (err) {
		    	$log.debug('Error while writing applet session data during applet close: ' + err.message + ' (applet ID: ' + session.getApplet().header.id + '), session was closed anyway, session data was lost');
    		}
        // Remove the session from the pool.
        removeSession(session);
	    	$log.debug('Applet session successfully removed: ' + session.id + ' (applet ID: ' + session.getApplet().header.id + ')');
    	});
    } else {
    	$log.debug('Warning: applet session not found for removal: ' + session.id + ' (applet ID: ' + session.getApplet().header.id + ')');
	  }
  };

  root.finalize = function() {
    // Deactivate and destroy all sessions.
    try {
      root.deactivateSession(root._activeSessionId);
    } catch(e) {}; // Ignore errors if there is no active session.

    for (var i = 0; i < root._appletSessionPool.length; i++) {
      root.destroySession(root._appletSessionPool[i]);
    }
  };

  return root;
});
