'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $log, $ionicModal, lodash) {

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

    var container;

    /**
     * Priviledged methods
     */

    this.getContainer = function() {
      return container;
    };

    this.finalize = function(callback) {
      callback();
    };

    this.createContainer = function(session) {
      container = $ionicModal.fromTemplate('\
        <ion-modal-view class="applet-view ng-hide" ng-controller="AppletViewCtrl">\
          <ion-footer-bar class="applet-footer-bar">\
            <button class="footer-bar-item item-center button button-clear button-icon button-applet-close"\
              ng-click="applet.close(\'' + session.id + '\')">\
            </button>\
          </ion-footer-bar>\
          <ion-pane>\
            <div class="applet-splash fade-splash"\
              ng-hide="!applet.configuration.showSplash" ng-if="applet.view.splashBackground.length > 0">\
            </div>\
            <iframe class="applet-frame" src="' + this.uri + 'index.html?sessionId=' + session.id + '"></iframe>\
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

    return this;
  };

  /**
   * Events
   */

  $rootScope.$on('modal.shown', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('$pre.afterEnter', modal.session.plugin);
  });

  $rootScope.$on('modal.hidden', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('$pre.afterLeave', modal.session.plugin);
  });

  /**
   * Public methods
   */

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
