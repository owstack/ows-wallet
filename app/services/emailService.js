'use strict';

angular.module('owsWalletApp.services').factory('emailService', function($log, configService, walletService, profileService) {
  var root = {};

  root.updateEmail = function(opts) {
    opts = opts || {};
    if (!opts.email) return;

    var wallets = profileService.getWallets();

    configService.set({
      emailNotifications: {
        enabled: opts.enabled,
        email: opts.enabled ? opts.email : null
      }
    }, function(err) {
      if (err) {
        $log.error(err);
      }
      walletService.updateRemotePreferences(wallets);
    });
  };

  root.getEmailIfEnabled = function(config) {
    config = config || configService.getSync();
    if (config.emailNotifications) {
      if (!config.emailNotifications.enabled) {
        return;
      }

      if (config.emailNotifications.email) {
        return config.emailNotifications.email;
      }
    }
  };

  root.init = function() {
    configService.whenAvailable(function(config) {
      if (config.emailNotifications && config.emailNotifications.enabled) {
        // If email already set
        if (config.emailNotifications.email) {
          return;
        }

        var currentEmail = root.getEmailIfEnabled(config);

        root.updateEmail({
          enabled: currentEmail ? true : false,
          email: currentEmail
        });
      }
    });
  };

  return root;
});
