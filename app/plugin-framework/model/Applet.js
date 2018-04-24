'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $timeout, $log, $injector, lodash, PluginCatalog, ServiceDelegate) {

  var self = this;
  var _serviceDelegates = {};
  var _publishedKeys = [];

  // Reserved applet properties should not be overwritten by the applet plugin.
  Applet.reservedProperties = [
    'header',
    'model',
    'view',
    'path'
  ];

  Applet.FLAGS_ALL = 0;
  Applet.FLAGS_MAY_NOT_HIDE = 1;

  // Default applet configuration.
  var defaultLaunchConfig = {
    showSplash: true
  };

  var defaultConfig = defaultLaunchConfig;

  // Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
  // 
  function Applet(obj, skin) {
    lodash.assign(this, obj);
    this.skin = skin;
    this.flags = Applet.FLAGS_ALL;
    this.config = lodash.cloneDeep(defaultConfig);
    return this;
  };

  // Public methods
  //
  Applet.prototype.initEnvironment = function() {
    publishConfig(defaultLaunchConfig);
    publishProperties(this);
  };

  Applet.prototype.setConfig = function(config) {
    lodash.merge(this.config, config);
    publishConfig(this.config);
  };

  Applet.prototype.mainViewUrl = function() {
    return PluginCatalog.getEntry(this.header.pluginId).mainViewUri;
  };

  Applet.prototype.property = function(key, value) {    
    if (!isReservedProperty(key) && value) {
      $rootScope.applet[key] = value;
      if (!_publishedKeys.includes(key)) {
        _publishedKeys.push(key);
      }
    }
    return $rootScope.applet[key];
  };

  Applet.prototype.initService = function(pluginId) {
    var serviceIndex = lodash.findIndex(this.services, function(service) {
      return service.pluginId == pluginId;
    });

    if (serviceIndex < 0) {
      throw new Error('Configuration for skin \'' + this.skin.header.name + '\' is missing required configuration for service plugin id \'' + pluginId + '\'');
    }

    // Find the plugin specified service class in the registry, use $injector to get the factory object,
    // and create a new service instance.  Using the $injector here allows this class (factory) from having
    // to declare dependencies on dynamically defined (plugin) service classes (factory's).
    var serviceApi = PluginCatalog.getServiceApi(pluginId);
    var service = $injector.get(serviceApi);
//    return eval(new service(this.services[serviceIndex]));
    var service = eval(new service(this.services[serviceIndex]));
    _serviceDelegates[pluginId] = new ServiceDelegate(service);
  };

  Applet.prototype.getServiceDelegate = function(pluginId) {
    return _serviceDelegates[pluginId];
  };

  Applet.prototype.open = function() {
    // Invoke rootScope published function to avoid dependency on appletService.
    $rootScope.applet.open(this);
  };

  Applet.prototype.close = function() {
    // Invoke rootScope published function to avoid dependency on appletService.
    $rootScope.applet.close();
  };

  Applet.prototype.finalize = function(callback) {
    // Delete published properties.
    for (var i = 0; i < _publishedKeys.length; i++) {
      delete $rootScope.applet[_publishedKeys[i]];
    }

    // Delete the published applet.
    delete $rootScope.applet;

    callback();
  };

  // Private methods
  //
  function isReservedProperty(key) {
    return Applet.reservedProperties.includes(key);
  };

  function publishConfig(config) {
    $rootScope.applet.config = $rootScope.applet.config || {};
    lodash.merge($rootScope.applet.config, config);

    $timeout(function() {
      $rootScope.$apply();
    });
  };

  function publishProperties(applet) {
    $rootScope.applet.header = applet.header;
    $rootScope.applet.model = applet.model;
    $rootScope.applet.view = applet.view;
    $rootScope.applet.path = PluginCatalog.getEntry(applet.header.pluginId).path;
    $rootScope.applet.title = applet.header.name;
  };
  
  return Applet;
});
