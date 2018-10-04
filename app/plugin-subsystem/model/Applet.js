'use strict';

angular.module('owsWalletApp.pluginModel').factory('Applet', function ($rootScope, $log, $ionicModal, $ionicTemplateLoader, $state, lodash, platformInfoService) {

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
    this.session;

    this.container = {
      kind: '',
      obj: {}
    };

    var containerOps = {
      cover: {
        // Hide and show affects both the parent modal backdrop and the model view elements. Doing this covers all presentation cases
        // including initial launch (initially modal element hidden) and presentation of the scanner modal (requires the applet modal
        // to be completely hidden, including the backdrop).
        show: function() {
          angular.element(self.container.obj.el).removeClass('ng-hide');
          angular.element(self.container.obj.modalEl).removeClass('ng-hide');
        },
        hide: function() {
          angular.element(self.container.obj.el).addClass('ng-hide');
          angular.element(self.container.obj.modalEl).addClass('ng-hide');
        },
        remove: function() {
          self.container.obj.remove();
        }
      },
      contain: {
        // Hide and show affect only the container itself. App modals will cover the applet presentation.
        show: function() {
          angular.element(self.container.obj.el).removeClass('ng-hide');
        },
        hide: function() {
          angular.element(self.container.obj.el).addClass('ng-hide');
        },
        remove: function() {
          angular.element(self.container.obj.el).remove();
        }
      }
    };

    /**
     * Priviledged methods
     */

    this.logId = function() {
      return self.header.name + '@' + self.header.version + '/' + self.header.kind;
    };

    this.open = function() {
      // Invoke rootScope published function to avoid dependency on appletService.
      $rootScope.applet.open(self);
    };

    this.close = function() {
      // Invoke rootScope published function to avoid dependency on appletService.
      $rootScope.applet.close(self.session.id);
    };

    this.show = function() {
      containerOps[self.container.kind].show();

      self.session.notify({
        name: 'applet.shown',
        data: {}
      });
    };

    this.hide = function() {
      containerOps[self.container.kind].hide();

      self.session.notify({
        name: 'applet.hidden',
        data: {}
      });
    };

    this.enter = function() {
      self.session.notify({
        name: 'applet.enter',
        data: {}
      });
    };

    this.leave = function() {
      self.session.notify({
        name: 'applet.leave',
        data: {}
      });
    };

    this.finalize = function(callback) {
      callback();
    };

    this.remove = function() {
      containerOps[self.container.kind].remove();
    };

    // Applets may be opened into any of the following containers.
    // - Cover; an Ionic modal
    // - Extension Point (XP); an Ionic pane or similar
    //
    // Opening an applet requires the following actions.
    // 1. creating the container
    // 2. inserting the container into the DOM
    //
    // For an applet to run at all the container must be inserted into the DOM. In order for the applet to be initially hidden
    // (e.g., while initialing state) the applet should be designed with CSS rendering the applet invisible using 'ng-hide'. When the
    // applet is ready to be shown the 'ng-hide' class is removed allowing the container to be displayed (animatation starts when the
    // 'ng-hide' class is removed).
    // 
    // Detecting when the applet is ready is accomplished by waiting for the applet to send the /start message. When the /start message
    // is received from the applet the 'Local/ShowApplet' event is broadcast. In the event handler the 'ng-hide' class is removed from
    // the container and, as required, animation to the main app view (view-container) is applied (e.g., app zooms out while applet zooms in).
    //
    // Cover Container
    //
    // Opening a 'cover'ing applet is signaled by an applet launch setting; applet.launch.options.viewport == 'cover'. A modal is
    // used as the container for the applet. Ionic appends modals to the end of the document resulting in the applet covering app
    // app content.
    //
    // Extension Point (XP) Container
    //
    // Opening a 'contain'ed applet is signaled by an applet launch setting; applet.launch.options.viewport == 'ows-axp-<name>'. Each
    // applet extension point is responsible for specifying its own extention point as a param to this.openApplet(id). The applet id is
    // found by querying the collection of applets for an applet with the viewport id equal to the extension point.
    // The content of the applet is inserted as a child of the element with the extension point id.
    //
    this.create = function(session) {
      $log.info('Creating applet [' + self.launch.options.viewport + ']: ' + self.logId());
      self.session = session;

      $rootScope.applet.view = {
        sessionId: session.id,
        url: self.uri + 'index.html?sessionId=' + session.id + '&isCordova=' + platformInfoService.isCordova
      };

      // Animate.css animations
      var animation = lodash.get(self, 'launch.options.animation', '');
      animation = (animation == 'none' ? '' : animation);
      if (animation.length > 0) {
        animation = 'animated ' + animation;
      }

      switch (self.launch.options.viewport) {
        case 'cover':
          createCoverContainer(animation);
          break;

        default:
          createContainContainer(animation);
          break;
      }

      function createCoverContainer(animation) {
        // Create and insert an applet modal into the DOM. Typically, the modal is hidden (e.g., ng-hide) resulting in the
        // modal.show() having the effect of only inserting the modal into the DOM.
        $ionicModal.fromTemplateUrl('views/applet-view/containers/cover/cover.html', {
          scope: $rootScope,
          backdropClickToClose: false,
          hardwareBackButtonClose: false,
          animation: animation,
          // hideDelay: 1000,
          session: self.session,
          name: 'applet'
        }).then(function(modal) {

          self.container.kind = 'cover';
          self.container.obj = modal;
          modal.show();

          // Kill the modal backdrop for this (the applet) instance of modal.
          angular.element(modal.el).css('background', 'none');
          angular.element(modal.el.getElementsByClassName('modal-backdrop-bg')[0]).css('opacity', '0');
        });
      };

      function createContainContainer(animation) {
        // Create and insert an applet container into the DOM.
        $ionicTemplateLoader.compile({
          scope: $rootScope,
          templateUrl: 'views/applet-view/containers/contain/contain.html',
        }).then(function(container) {

          self.container.kind = 'contain';
          self.container.obj = {
            $el: container.element, // scope is at $el.scope()
            el: container.element[0]
          };

          // Insert applet container into the DOM.
          var parent = angular.element(document.getElementById(self.launch.options.viewport));
          parent.append(self.container.obj.el);
        });
      };
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
