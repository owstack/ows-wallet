'use strict';

angular.module('owsWalletApp.services').factory('openUrlService', function($rootScope, $ionicHistory, $document, $log, platformInfoService, lodash, profileService, incomingDataService, appConfig, networkService) {
  var root = {};

  var handleOpenURL = function(args) {

    $log.info('Handling Open URL: ' + JSON.stringify(args));
    // Stop it from caching the first view as one to return when the app opens
    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableBack: false,
      disableAnimation: true
    });

    var url = args.url;
    if (!url) {
      $log.error('No url provided');
      return;
    };

    if (url) {
      if ('cordova' in window) {
        window.cordova.removeDocumentEventHandler('handleopenurl');
        window.cordova.addStickyDocumentEventHandler('handleopenurl');
      }
      document.removeEventListener('handleopenurl', handleOpenURL);
    }

    document.addEventListener('handleopenurl', handleOpenURL, false);

    if (!incomingDataService.redir(url)) {
      $log.warn('Unknown URL! : ' + url);
    }
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenURL, false);
  };

  root.init = function() {
    $log.debug('Initializing openURL');
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);

    if (platformInfoService.isNW) {
      var gui = require('nw.gui');

      // This event is sent to an existing instance of OWS wallet (only for standalone apps)
      gui.App.on('open', function(pathData) {
        lodash.forEach(networkService.getNetworks(), function(n) {
          if (pathData.includes(n.protocol)) {
            $log.debug(n.name + ' URL found');
            handleOpenURL({
              url: pathData.substring(pathData.indexOf(n.protocol))
            });
          }
        });

        if (pathData.indexOf(appConfig.name + '://') != -1) {
          $log.debug(appConfig.name + ' URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf(appConfig.name + '://'))
          });
        }
      });

      // Used at startup
      var argv = gui.App.argv;
      if (argv && argv[0]) {
        handleOpenURL({
          url: argv[0]
        });
      }
    } else if (platformInfoService.isDevel) {
      var base = window.location.origin + '/';
      var url = base + '#/uri/%s';

      if (navigator.registerProtocolHandler) {
        $log.debug('Registering Browser handlers base:' + base);
        // See permitted schemes at https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler
        lodash.forEach(networkService.getLiveNetworks(), function(n) {
          var prefix = (n.protocol != 'bitcoin' ? 'web+' : '');
          navigator.registerProtocolHandler(prefix + n.protocol, url, 'OWS Wallet ' + n.protocol + ' handler');
        });

        navigator.registerProtocolHandler('web+owswallet', url, 'OWS Wallet handler');
      }
    }
  };

  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  root.handleURL = function(args) {
    profileService.whenAvailable(function() {
      // Wait ux to settle
      setTimeout(function() {
        handleOpenURL(args);
      }, 1000);
    });
  };

  return root;
});
