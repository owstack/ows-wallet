'use strict';

angular.module('owsWalletApp.pluginApi').factory('ApiRouter', function (lodash, pathToRegexpService) {

  /**
   * API routes.
   *
   * A match is made by searching routes in order, the first match returns the route.
   */
  var routeMap = [
    { path: '/start',                         method: 'POST',   handler: 'start' },
    { path: '/ready',                         method: 'POST',   handler: 'ready' },
    { path: '/event',                         method: 'POST',   handler: 'event' },
    { path: '/info/host',                     method: 'GET',    handler: 'getHostInfo' },
    { path: '/info/platform',                 method: 'GET',    handler: 'getPlatformInfo' },
    { path: '/session/:id',                   method: 'GET',    handler: 'getSession' },
    { path: '/session/:id/choosewallet',      method: 'GET',    handler: 'chooseWallet' },
    { path: '/session/:id/flush',             method: 'POST',   handler: 'flushSession' },
    { path: '/session/:id/restore',           method: 'GET',    handler: 'restoreSession' },
    { path: '/session/:id/routes',            method: 'POST',   handler: 'addRoutes' },
    { path: '/session/:id/var/:name',         method: 'GET',    handler: 'getSessionVar' },
    { path: '/session/:id/var/:name',         method: 'POST',   handler: 'setSessionVar' },
    { path: '/session/:id/var/:name',         method: 'DELETE', handler: 'removeSessionVar' },
    { path: '/settings',                      method: 'GET',    handler: 'getSettings' },
    { path: '/transactions',                  method: 'POST',   handler: 'createTx' },
    { path: '/transactions/:guid',            method: 'PUT',    handler: 'statusTx' },
    { path: '/transactions/:guid/wallet/:id', method: 'PUT',    handler: 'updateTx' },
    { path: '/clipboard',                     method: 'PUT',    handler: 'handleClipboard' },
    { path: '/share',                         method: 'POST',   handler: 'socialShare' }
  ];

  /**
   * Constructor
   */

  function ApiRouter() {
    throw new Error('ApiRouter is a static class');
  };

  /**
   * Public methods
   */

  /** Add forwarding routes to our route map.
   * 
   * session - the plugin session of the requestor.
   * routes - the routes to add for the requestor.
   * 
   * A route map entry with a targetId will always be a forwarder.
   * 
   * routes: [{
   *   path: <string>
   *   method: <string>
   *   handler: [optional] <string>
   * }]
   *
   * where,
   *
   * path - the URL for routing a request.
   * method - an HTTP operation; GET, POST, PUT, DELETE.
   * handler - currently ignored.
   */
  ApiRouter.addRoutes = function(session, routes) {
    // Set the handler for each route to be a forwarder.
    var targetId = session.plugin.uri;
    routes = lodash.map(routes, function(value) {
      value.handler = 'forwarder';
      value.targetId = targetId;
      return value;
    });

    // Add the routes to the route map and retain the target id in the session as a reference to
    // the route owner.
    routeMap = lodash.concat(routeMap, routes);
    session.set('targetId', targetId, {transient: true});
  };

  ApiRouter.removeRoutes = function(session) {
    // Remove all routes matching the specified target id.
    var targetId = session.plugin.uri;
    lodash.remove(routeMap, function(r) {
      return r.targetId == targetId;
    });
  };

  ApiRouter.routeRequest = function(request) {
    var route = {};
    var m = false;

    for (var i = 0; i < routeMap.length; i++) {
      m = match(routeMap[i], request, route);
      if (m) {
        break;
      }
    }

    // Reply with a copy so our route map doesn't get written to.
    return (lodash.isEmpty(route) ? undefined : lodash.cloneDeep(route));
  };

  /**
   * Private static methods
   */

  function match(mapEntry, request, route) {
    var keys = [];

    var m = pathToRegexpService.pathToRegexp(mapEntry.path, keys).exec(request.url);

    if (!m) {
      return false;
    }

    if (mapEntry.method != request.method) {
      return false;
    }

    route.params = {};
    route.path = m[0];
    route.handler = mapEntry.handler;
    route.targetId = mapEntry.targetId;

    // Assign url parameters to the request.
    for (var i = 1; i < m.length; i++) {
      var key = keys[i - 1];
      var prop = key.name;
      var val = decodeParam(m[i]);

      if (val !== undefined || !(hasOwnProperty.call(route.params, prop))) {
        route.params[prop] = val;
      }
    }

    request.params = route.params;
    return true;
  };

  function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0) {
      return val;
    }

    try {
      return decodeURIComponent(val);
    } catch (err) {
      if (err instanceof URIError) {
        err.message = 'Failed to decode param \'' + val + '\'';
        err.status = err.statusCode = 400;
      }

      throw err;
    }
  }

  return ApiRouter;
});
