'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $log, $ionicModal, lodash, platformInfoService) {

  // Bit values for settings.
  // Avoids having to update schema to add booleans, also allows plugin schema to remain as a class.
  Applet.FLAGS_NONE = 0;
  Applet.FLAGS_MAY_NOT_HIDE = 1;

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
    this.sessionId;

    var container;

    /**
     * Priviledged methods
     */

    this.logId = function() {
      return this.header.name + '@' + this.header.version + '/' + this.header.kind;
    };

    this.getContainer = function() {
      return container;
    };

    this.finalize = function(callback) {
      callback();
    };

    this.createContainer = function(session) {
      this.sessionId = session.id;
      var src = this.uri + 'index.html?sessionId=' + session.id + '&isCordova=' + platformInfoService.isCordova;

      container = $ionicModal.fromTemplate('\
        <ion-modal-view id="applet-view" class="ng-hide" ng-controller="AppletViewCtrl">\
          <div drag-and-drop fixed-positions="true" class="applet-menu-drag-container" on-drag-end="onAppletMenuMove(draggable, droppable)"\
          on-item-removed"onRemoved(draggable, droppable)">\
            <div drag-item drag-enabled="true" class="applet-menu-drag-item" drag-id="mfb-menu"\
              x="{{menuPosition.x}}" y="{{menuPosition.y}}">\
              <ul mfb-menu class="applet-menu" position="br" effect="slidein-spring"\
                active-icon="ion-close-round" resting-icon="ion-navicon-round" toggling-method="click">\
                <button mfb-button icon="ion-wrench" label="Settings" ng-click="openSettings()"></button>\
                <button mfb-button icon="ion-power" label="Close Applet" ng-click="closeApplet(\'' + session.id + '\')"></button>\
              </ul>\
            </div>\
            <drop-spot max-items="1" class="applet-menu-drop-spot" drop-id="applet-menu-drop-spot"></drop-spot>\
          </div>\
          <ion-pane>\
            <iframe class="applet-frame" src="' + src + '"></iframe>\
          </ion-pane>\
          <wallet-menu title="walletSelectorTitle" wallets="wallets" selected-wallet="wallet" show="showWallets"\
            on-select="onWalletSelect" on-cancel="onWalletSelectCancel" has-tabs>\
          </wallet-menu>\
        </ion-modal-view>\
        ', {
        scope: $rootScope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'none', // Disable ionic animation, animation provided by animate.css in applet.scss
//        hideDelay: 1000,
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
    $rootScope.applet.close(this.sessionId);
  };
  
  return Applet;
});
