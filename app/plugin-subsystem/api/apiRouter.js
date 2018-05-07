'use strict';

angular.module('owsWalletApp.pluginApi').service('apiRouter', function (lodash, pathToRegexpService) {

  var root = {};

  // API routes.
  // A match is made by searching routes in order, the first match returns the route.
  //
  var routeMap = [
    { path: '/start',                                  method: 'POST', handler: 'start' },
    { path: '/session/:id',                            method: 'GET',  handler: 'getSession' },
    { path: '/session/:id/applet',                     method: 'GET',  handler: 'getAppletForSession' },
    { path: '/session/:id/flush',                      method: 'POST', handler: 'flushSession' },
    { path: '/session/:id/restore',                    method: 'POST', handler: 'restoreSession' },
    { path: '/session/:id/var/:name',                  method: 'GET',  handler: 'getSessionVar' },
    { path: '/session/:id/var/:name',                  method: 'POST', handler: 'setSessionVar' },
    { path: '/applet/:id/service/:pluginId/init',      method: 'POST', handler: 'initService' },
    { path: '/applet/:id/service/:pluginId/:fn',       method: 'POST', handler: 'callService' },
    { path: '/info/platform',                          method: 'GET',  handler: 'getPlatformInfo' }
  ];

  root.routeRequest = function(request) {
    var route = {};
    var m = false;

    for (var i = 0; i < routeMap.length; i++) {
      m = match(routeMap[i], request, route);
      if (m) break;
    }

    return (lodash.isEmpty(route) ? undefined : route);
  };

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

  return root;
});
