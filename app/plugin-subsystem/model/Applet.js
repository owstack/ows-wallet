'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $log, $ionicModal, $state, lodash, platformInfoService) {

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

    this.open = function() {
      // Invoke rootScope published function to avoid dependency on appletService.
      $rootScope.applet.open(this);
    };

    this.close = function() {
      // Invoke rootScope published function to avoid dependency on appletService.
      $rootScope.applet.close(this.sessionId);
    };

    this.remove = function() {
      container.remove();
    };

    this.finalize = function(callback) {
      callback();
    };

    // Hide and show affects both the parent modal backdrop and the model view elements. Doing this covers all presentation cases
    // including intial launch (initially modal element hidden) and presentation of the scanner modal (requires the applet modal
    // to be completely hidden, including the backdrop).
    this.hide = function() {
      angular.element(container.el).addClass('ng-hide');
      angular.element(container.modalEl).addClass('ng-hide');
    };

    this.show = function() {
      angular.element(container.el).removeClass('ng-hide');
      angular.element(container.modalEl).removeClass('ng-hide');
    };

    this.logId = function() {
      return this.header.name + '@' + this.header.version + '/' + this.header.kind;
    };

    // Opening an applet involves two elements; (1.) showing the modal and (2.) allowing the modal to init/render.
    // For an applet to run at all the modal must be inserted into the DOM but this prompts ionic to visually render the modal.
    // To prevent the modal from rendering on $modal.show() we initialize the modal html (ion-modal-view) with class 'ng-hide'.
    // When the applet is ready to be shown the 'ng-hide' class is removed from the ion-modal-view allowing the modal to animate in.
    // 
    // Detecting when the applet is ready is accomplished waiting for the applet to send the /start message. When the /start message
    // is received from the applet the 'Local/StartPluginUI' event is broadcast. In the event handler we remove the 'ng-hide' class
    // from the ion-modal-view. We also apply some animation to the main app view (view-container) for improved UX.
    //
    this.createContainer = function(session) {
      $rootScope.applet.view = {
        sessionId: session.id,
        url: this.uri + 'index.html?sessionId=' + session.id + '&isCordova=' + platformInfoService.isCordova
      };

      $ionicModal.fromTemplateUrl('views/applet-view/applet-view.html', {
        scope: $rootScope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'animated ' + self.launch.options.entrance, // Animate.css animations
//        hideDelay: 1000,
        session: session,
        name: 'applet'
      }).then(function(modal) {

        container = modal;
        modal.show();

        // Kill the modal backdrop for this (the applet) instance of modal.
        angular.element(modal.el).css('background', 'none');
        angular.element(modal.el.getElementsByClassName('modal-backdrop-bg')[0]).css('opacity', '0');
      });

      return;
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
  
  return Applet;
});
