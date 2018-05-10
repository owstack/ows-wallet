'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $log, $injector, $ionicModal, lodash, PluginCatalog, ServiceDelegate) {

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
    var self = this;

    lodash.assign(this, lodash.cloneDeep(obj));
    this.configuration = lodash.merge(lodash.cloneDeep(defaultConfiguration), obj.configuration);

    var serviceDelegates = {};

    /**
     * Priviledged methods
     */

    this.initEnvironment = function() {
    };

    this.initService = function(pluginId) {
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
      serviceDelegates[pluginId] = new ServiceDelegate(service);
    };

    this.getServiceDelegate = function(pluginId) {
      return serviceDelegates[pluginId];
    };

    this.finalize = function(callback) {
      callback();
    };

    return this;
  };

  /**
   * Events
   */

  $rootScope.$on('modal.shown', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('$pre.afterEnter', modal.session.getApplet());
  });

  $rootScope.$on('modal.hidden', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('$pre.afterLeave', modal.session.getApplet());
  });

  /**
   * Public methods
   */

  Applet.prototype.mainViewUrl = function() {
    return this.uri + (this.mainView || 'index.html');
  };

  Applet.prototype.createContainer = function(session) {
    this.initEnvironment();

    var container = $ionicModal.fromTemplate('\
      <ion-modal-view class="applet-view ng-hide" ng-controller="AppletViewCtrl">\
        <ion-footer-bar class="applet-footer-bar">\
          <button class="footer-bar-item item-center button button-clear button-icon button-applet-close"\
            ng-click="applet.close(\'' + session.id + '\')"></button>\
        </ion-footer-bar>\
        <ion-pane>\
          <div class="applet-splash fade-splash"\
            ng-hide="!applet.configuration.showSplash" ng-if="applet.view.splashBackground.length > 0"></div>\
          <iframe class="applet-frame" src="' + this.mainViewUrl() + '?sessionId=' + session.id + '"></iframe>\
        </ion-pane>\
        <wallet-menu title="walletSelectorTitle" wallets="wallets" selected-wallet="wallet" show="showWallets"\
          on-select="onWalletSelect" on-cancel="onCancel" has-tabs>\
        </wallet-menu>\
      </ion-modal-view>\
      ', {
      scope: $rootScope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false,
      animation: 'none', // Disable ionic animation, animation provided by animate.css in applet.css
      hideDelay: 1000,
      session: session,
      name: 'applet'
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
  
  return Applet;
});
