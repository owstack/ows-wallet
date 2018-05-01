'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $timeout, $log, $injector, $ionicModal, $ionicPopover, lodash, PluginCatalog, ServiceDelegate) {

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

  // Bit values for settings.
  // Avoids having to update schema to add booleans, also allows plugin schema to remain as a class.
  Applet.FLAGS_NONE = 0;
  Applet.FLAGS_SHOW_SPLASH = 1;
  Applet.FLAGS_MAY_NOT_HIDE = 2;

  // Configuration schema and default values.
  var defaultConfiguration = {
    flags: Applet.FLAGS_NONE
  };

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function Applet(obj) {
    lodash.assign(this, lodash.cloneDeep(obj));
    this.configuration = lodash.merge(lodash.cloneDeep(defaultConfiguration), obj.configuration);
    return this;
  };

  /**
   * Events
   */

  $rootScope.$on('modal.shown', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('Local/AppletShown', modal.session.getApplet());
  });

  $rootScope.$on('modal.hidden', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('Local/AppletHidden', modal.session.getApplet());
  });

  /**
   * Public methods
   */

  Applet.prototype.initEnvironment = function() {
    publishConfiguration(defaultConfiguration);
    publishProperties(this);
  };

  Applet.prototype.setConfiguration = function(configuration) {
    lodash.merge(this.configuration, configuration);
    publishConfiguration(this.configuration);
  };

  Applet.prototype.mainViewUrl = function() {
    return this.uri + (this.mainView || 'index.html');
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

  Applet.prototype.createContainer = function(session) {
    this.initEnvironment();

    var container = $ionicModal.fromTemplate('\
      <ion-modal-view class="applet-modal">\
        <ion-footer-bar class="footer-bar-applet" ng-style="{\'background\':applet.view.footerBarBackground, \'border-top\':applet.view.footerBarBorderTop}">\
          <button class="footer-bar-item item-center button button-clear button-icon button-applet-close"\
          ng-style="{\'color\':applet.view.footerBarButtonColor}" ng-click="applet.close(\'' + session.id + '\')"></button>\
          <button class="footer-bar-item item-right button button-clear button-icon ion-more"\
          ng-style="{\'color\':applet.view.footerBarButtonColor}" ng-click="appletInfoPopover.show($event)"></button>\
        </ion-footer-bar>\
        <script id="templates/appletInfoPopover.html" type="text/ng-template">\
          <ion-popover-view class="popover-applet" ng-style="{\'background\':applet.view.popupInfoBackground, \'color\':applet.view.popupInfoColor}">\
            <ion-content scroll="false" class="m0i">\
              <div class="row">\
                <div class="col col-25">\
                  <i class="icon xl-icon left-icon" style="padding: 0;top: 10px;position: relative;">\
                    <div class="bg" style="background-image: url(' + this.iconImage + ')"></div>\
                  </i>\
                </div>\
                <div class="col info">\
                  <span class="name">' + this.header.name + '</span><br>\
                  <span class="author">' + this.header.author + '</span><br>\
                  <span class="version">' + this.header.version + '</span>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col">\
                  <span class="description">' + this.header.description + '</span>\
                </div>\
              </div>\
            </ion-content>\
          </ion-popover-view>\
        </script>\
        <ion-pane ng-style="{\'background\': applet.view.background}">\
          <div class="applet-splash fade-splash" ng-style="{\'background\':applet.view.splashBackground}"\
            ng-hide="!applet.configuration.showSplash" ng-if="applet.view.splashBackground.length > 0"></div>\
          <iframe class="applet-frame" src="' + this.mainViewUrl() + '?sessionId=' + session.id + '"></iframe>\
        </ion-pane>\
      </ion-modal-view>\
      ', {
      scope: $rootScope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false,
      animation: 'animated zoomIn',
      hideDelay: 1000,
      session: session,
      name: 'applet'
    });

    $ionicPopover.fromTemplateUrl('templates/appletInfoPopover.html', {
      scope: container.scope,
    }).then(function(popover) {
      $rootScope.appletInfoPopover = popover;
    });

    return container;
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

  /**
   * Private methods
   */

  function isReservedProperty(key) {
    return Applet.reservedProperties.includes(key);
  };

  function publishConfiguration(configuration) {
    $rootScope.applet.configuration = $rootScope.applet.configuration || {};
    lodash.merge($rootScope.applet.configuration, configuration);

    $timeout(function() {
      $rootScope.$apply();
    });
  };

  function publishProperties(applet) {
    $rootScope.applet.header = applet.header;
    $rootScope.applet.model = applet.model;
    $rootScope.applet.view = applet.view;
    $rootScope.applet.path = applet.uri;
    $rootScope.applet.title = applet.header.name;
  };
  
  return Applet;
});
