'use strict';

angular.module('owsWalletApp.services').factory('navigationService', function($rootScope, configService, tabRoutes, sideMenuRoutes) {
  var root = {};

  // List of recognized navigation routing schemes.
  var schemes = {
    'side-menu': {
      label: "Side Menu",
      routes: sideMenuRoutes
    },
    'tabs': {
      label: "Tabs",
      routes: tabRoutes
    }
  };

  // Ensure a default scheme is used if configuration fails.
  var currentScheme = schemes['tabs'];

  // Read the configured app navigation scheme.
  configService.get(function(err, config) {
    if (err) {
      $log.warn('Failed to read app config while setting up app navigation scheme: ' + err);
      return;
    }
    currentScheme = config.appNavigation.scheme;
  });

  root.usingSideMenu = function() {
    return currentScheme == 'side-menu';
  };

  root.usingTabs = function() {
    return currentScheme == 'tabs';
  }

  root.getSchemes = function() {
    return Object.keys(schemes);
  };

  root.schemeLabelFor = function(scheme) {
    return schemes[scheme].label;
  };

  root.init = function(stateProvider) {
    // Select the scheme routing.
    var routes = schemes[currentScheme].routes;

    if (!routes) {
      throw ('Error: app navigation scheme not found: ' + currentScheme);
    }

    // Provide global access to map the specified state name and create a valid ui-sref string.
    $rootScope.sref = function(stateName, arg) {
      var sref = routes.sref(stateName);
      if (arg) {
        sref += '(' + JSON.stringify(arg) + ')';
      }
      return sref;
    };

    // Construct the views for a specified state.
    var getViews = function(stateName, viewObjs) {
      var views = {};
      for (var i=0; i < viewObjs.length; i++) {
        var viewName = routes.vref(stateName, i);
        views[viewName] = viewObjs[i];
      }
      return views;
    };

    // Set the app base routing scheme.
    routes.set(stateProvider);

    // Set the app routes using state names from the configured app navigation scheme.
    stateProvider

    /*
     *
     * Other pages
     *
     */

    .state('unsupported', {
      url: '/unsupported',
      templateUrl: 'views/startup/unsupported/unsupported.html'
    })
    .state('starting', {
      url: '/starting',
      templateUrl: 'views/startup/starting/starting.html'
    })

    /*
     *
     * URI
     *
     */

    .state('uri', {
      url: '/uri/:url',
      controller: function($stateParams, $log, openUrlService, profileService) {
        profileService.whenAvailable(function() {
          $log.info('DEEP LINK from Browser:' + $stateParams.url);
          openUrlService.handleURL({
            url: $stateParams.url
          });
        })
      }
    })

    /*
     *
     * Wallet
     *
     */

    .state($rootScope.sref('wallet'), {
      url: '/wallet/:walletId/:fromOnboarding',
      views: getViews('wallet', [{
        controller: 'WalletCtrl',
        templateUrl: 'views/wallet/wallet.html'
      }])
    })
    .state($rootScope.sref('activity'), {
      url: '/activity',
      views: getViews('activity', [{
        controller: 'WalletActivityCtrl',
        templateUrl: 'views/home/wallet-activity/wallet-activity.html',
      }])
    })
    .state($rootScope.sref('proposals'), {
      url: '/proposals',
      views: getViews('proposals', [{
        controller: 'ProposalsCtrl',
        templateUrl: 'views/home/proposals/proposals.html',
      }])
    })
    .state($rootScope.sref('wallet.tx-details'), {
      url: '/tx-details/:walletId/:txid',
      views: getViews('wallet.tx-details', [{
        controller: 'TxDetailsCtrl',
        templateUrl: 'views/wallet/tx-details/tx-details.html'
      }])
    })
    .state($rootScope.sref('wallet.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('wallet.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state($rootScope.sref('wallet.backup'), {
      url: '/backup/:walletId',
      views: getViews('wallet.backup', [{
        templateUrl: 'views/backup/backup.html',
        controller: 'BackupCtrl'
      }])
    })
    .state($rootScope.sref('wallet.addresses'), {
      url: '/addresses/:walletId/:toAddress',
      views: getViews('wallet.addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/addresses.html'
      }])
    })
    .state($rootScope.sref('wallet.all-addresses'), {
      url: '/all-addresses/:walletId',
      views: getViews('wallet.all-addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/all-addresses/all-addresses.html'
      }])
    })

    /*
     *
     * All Wallets
     *
     */

    .state($rootScope.sref('home.all-wallets'), {
      url: '/all-wallets',
      views: getViews('home.all-wallets', [{
        controller: 'WalletGridCtrl',
        templateUrl: 'views/home/layout/wallet-grid/wallet-grid.html'
      }])
    })

    /*
     *
     * Main views
     *
     */
    .state($rootScope.sref('home'), {
//        nativeTransitions: null,
      url: '/home/:fromOnboarding',
      views: getViews('home', [{
        controller: 'HomeCtrl',
        templateUrl: 'views/home/home.html'
      }]),
      params: {
        wallets: null,
        openWallet: null
      }
    })
    .state($rootScope.sref('receive'), {
//        nativeTransitions: null,
      url: '/receive/:walletId',
      views: getViews('receive', [{
        controller: 'ReceiveCtrl',
        templateUrl: 'views/receive/receive.html',
      }])
    })
    .state($rootScope.sref('scan'), {
//        nativeTransitions: null,
      url: '/scan',
      views: getViews('scan', [{
        controller: 'ScanCtrl',
        templateUrl: 'views/scan/scan.html',
      }])
    })
    .state('scanner', {
//        nativeTransitions: null,
      url: '/scanner',
      params: {
        passthroughMode: null,
      },
      controller: 'ScanCtrl',
      templateUrl: 'views/scan/scan.html'
    })
    .state($rootScope.sref('send'), {
//        nativeTransitions: null,
      url: '/send/:walletId',
      views: getViews('send', [{
        controller: 'SendCtrl',
        templateUrl: 'views/send/send.html',
      }])
    })
    .state($rootScope.sref('settings'), {
//        nativeTransitions: null,
      url: '/settings',
      views: getViews('settings', [{
        controller: 'AppSettingsCtrl',
        templateUrl: 'views/app-settings/settings.html',
      }])
    })

    /*
     *
     * Send
     *
     */

    .state($rootScope.sref('send.amount'), {
      url: '/amount/:walletId/:networkURI/:recipientType/:toAddress/:toName/:toEmail/:toColor',
      views: getViews('send.amount', [{
        controller: 'AmountCtrl',
        templateUrl: 'views/send/amount/amount.html'
      }])
    })
    .state($rootScope.sref('send.confirm'), {
      url: '/confirm/:walletId/:networkURI/:recipientType/:toAddress/:toName/:toAmount/:toEmail/:toColor/:description/:useSendMax',
      views: getViews('send.confirm', [{
        controller: 'ConfirmCtrl',
        templateUrl: 'views/send/confirm/confirm.html'
      }]),
      params: {
        paypro: null
      }
    })
    .state($rootScope.sref('send.address-book'), {
      url: '/address-book/add/:fromSendTab',
      views: getViews('send.address-book', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })

    /*
     *
     * Add
     *
     */

    .state($rootScope.sref('add'), {
      url: '/add',
      views: getViews('add', [{
        templateUrl: 'views/add-wallet/add-wallet.html'
      }])
    })
    .state($rootScope.sref('add.join'), {
      url: '/join/:url',
      views: getViews('add.join', [{
        controller: 'JoinWalletCtrl',
        templateUrl: 'views/add-wallet/join/join.html'
      }])
    })
    .state($rootScope.sref('add.import'), {
      url: '/import/:code',
      views: getViews('add.import', [{
        controller: 'ImportWalletCtrl',
        templateUrl: 'views/add-wallet/import/import.html'
      }])
    })
    .state($rootScope.sref('add.create-personal'), {
      url: '/create-personal',
      views: getViews('add.create-personal', [{
        controller: 'CreateWalletCtrl',
        templateUrl: 'views/add-wallet/create/personal/personal.html'
      }])
    })
    .state($rootScope.sref('add.create-shared'), {
      url: '/create-shared',
      views: getViews('add.create-shared', [{
        controller: 'CreateWalletCtrl',
        templateUrl: 'views/add-wallet/create/shared/shared.html'
      }])
    })

    /*
     *
     * Global Settings
     *
     */

    .state($rootScope.sref('notifications'), {
      url: '/notifications',
      views: getViews('notifications', [{
        controller: 'NotificationsSettingsCtrl',
        templateUrl: 'views/app-settings/notifications/notifications.html'
      }])
    })
    .state($rootScope.sref('language'), {
      url: '/language',
      views: getViews('language', [{
        controller: 'LanguageSettingsCtrl',
        templateUrl: 'views/app-settings/language/language.html'
      }])
    })
    .state($rootScope.sref('networks'), {
      url: '/networks/:id',
      views: getViews('networks', [{
        controller: 'NetworksCtrl',
        templateUrl: 'views/app-settings/networks/networks.html'
      }])
    })
    .state($rootScope.sref('network-settings'), {
      url: '/network-settings/:networkURI',
      views: getViews('network-settings', [{
        controller: 'NetworksCtrl',
        templateUrl: 'views/app-settings/networks/networks.html'
      }])
    })
    .state($rootScope.sref('unit'), {
      url: '/unit/:networkURI',
      views: getViews('unit', [{
        controller: 'NetworkUnitSettingsCtrl',
        templateUrl: 'views/app-settings/networks/unit/unit.html'
      }])
    })
    .state($rootScope.sref('fee'), {
      url: '/fee/:networkURI',
      views: getViews('fee', [{
        controller: 'NetworkFeePolicySettingsCtrl',
        templateUrl: 'views/app-settings/networks/fee-policy/fee-policy.html'
      }])
    })
    .state($rootScope.sref('alternative-currency'), {
      url: '/alternative-currency/:networkURI',
      views: getViews('alternative-currency', [{
        controller: 'NetworkAltCurrencySettingsCtrl',
        templateUrl: 'views/app-settings/networks/alt-currency/alt-currency.html'
      }])
    })
    .state($rootScope.sref('about'), {
      url: '/about',
      views: getViews('about', [{
        controller: 'AboutCtrl',
        templateUrl: 'views/app-settings/about/about.html'
      }])
    })
    .state($rootScope.sref('about.log'), {
      url: '/logs',
      views: getViews('about.log', [{
        controller: 'SessionLogCtrl',
        templateUrl: 'views/app-settings/session-log/session-log.html'
      }])
    })
    .state($rootScope.sref('about.terms-of-use'), {
      url: '/terms-of-use',
      views: getViews('about.terms-of-use', [{
        templateUrl: 'views/app-settings/terms-of-use/terms-of-use.html'
      }])
    })
    .state($rootScope.sref('advanced'), {
      url: '/advanced',
      views: getViews('advanced', [{
        controller: 'AdvancedAppSettingsCtrl',
        templateUrl: 'views/app-settings/advanced/advanced.html'
      }])
    })
    .state($rootScope.sref('advanced.experiments'), {
      url: '/experiments',
      views: getViews('advanced.experiments', [{
        controller: 'ExperimentsAppSettingsCtrl',
        templateUrl: 'views/app-settings/experiments/experiments.html'
      }])
    })
    .state($rootScope.sref('app-lock'), {
      url: '/app-lock',
      views: getViews('app-lock', [{
        controller: 'AppLockSettingsCtrl',
        templateUrl: 'views/app-settings/app-lock/app-lock.html',
      }])
    })
    .state($rootScope.sref('pin'), {
      url: '/pin/:action',
      views: getViews('pin', [{
        controller: 'PinCtrl',
        templateUrl: 'views/app-settings/app-lock/pin/pin.html',
        cache: false
      }])
    })

    /*
     *
     * Wallet preferences
     *
     */
    .state($rootScope.sref('preferences'), {
      url: '/preferences/:walletId',
      views: getViews('preferences', [{
        controller: 'WalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/wallet-settings.html'
      }])
    })
    .state($rootScope.sref('preferences.alias'), {
      url: '/preferences/alias/:walletId',
      views: getViews('preferences.alias', [{
        controller: 'WalletAliasSettingsCtrl',
        templateUrl: 'views/wallet-settings/alias/alias.html'
      }])    
    })
    .state($rootScope.sref('preferences.color'), {
      url: '/preferences/color/:walletId',
      views: getViews('preferences.color', [{
        controller: 'WalletColorSettingsCtrl',
        templateUrl: 'views/wallet-settings/color/color.html'
      }])
    })
    .state($rootScope.sref('preferences.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('preferences.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state($rootScope.sref('preferences.backup'), {
      url: '/backup/:walletId',
      views: getViews('preferences.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })
    .state($rootScope.sref('preferences.advanced'), {
      url: '/preferences/advanced/:walletId',
      views: getViews('preferences.advanced', [{
        controller: 'AdvancedWalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/advanced/advanced.html'
      }])
    })
    .state($rootScope.sref('preferences.information'), {
      url: '/information/:walletId',
      views: getViews('preferences.information', [{
        controller: 'WalletInformationCtrl',
        templateUrl: 'views/wallet-settings/information/information.html'
      }])
    })
    .state($rootScope.sref('preferences.export'), {
      url: '/export/:walletId',
      views: getViews('preferences.export', [{
        controller: 'ExportWalletCtrl',
        templateUrl: 'views/wallet-settings/export/export.html'
      }])
    })
    .state($rootScope.sref('preferences.wallet-service-url'), {
      url: '/preferences/wallet-service-url/:walletId',
      views: getViews('preferences.wallet-service-url', [{
        controller: 'WalletServiceUrlSettingsCtrl',
        templateUrl: 'views/wallet-settings/wallet-service-url/wallet-service-url.html'
      }])
    })
    .state($rootScope.sref('preferences.history'), {
      url: '/preferences/history/:walletId',
      views: getViews('preferences.history', [{
        controller: 'WalletHistorySettingsCtrl',
        templateUrl: 'views/wallet-settings/history/history.html'
      }])
    })
    .state($rootScope.sref('preferences.external'), {
      url: '/preferences/external-hardware/:walletId',
      views: getViews('preferences.external', [{
        controller: 'ExternalHardwareWalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/external-hardware/external-hardware.html'
      }])
    })
    .state($rootScope.sref('preferences.delete'), {
      url: '/delete/:walletId',
      views: getViews('preferences.delete', [{
        controller: 'DeleteWalletCtrl',
        templateUrl: 'views/wallet-settings/delete/delete.html'
      }])
    })

    /*
     *
     * Addresses
     *
     */

    .state($rootScope.sref('settings.addresses'), {
      url: '/addresses/:walletId/:toAddress',
      views: getViews('settings.addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/addresses.html'
      }])
    })
    .state($rootScope.sref('settings.all-addresses'), {
      url: '/all-addresses/:walletId',
      views: getViews('settings.all-addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/all-addresses/all-addresses.html'
      }])
    })

    /*
     *
     * Copayers
     *
     */

    .state($rootScope.sref('copayers'), {
      url: '/copayers/:walletId',
      views: getViews('copayers', [{
        controller: 'CopayersCtrl',
        templateUrl: 'views/wallet/copayers/copayers.html'
      }])
    })

    /*
     *
     * Addressbook
     *
     */

    .state($rootScope.sref('address-book'), {
      url: '/address-book',
      views: getViews('address-book', [{
        controller: 'AddressBookCtrl',
        templateUrl: 'views/address-book/address-book.html'
      }])
    })
    .state($rootScope.sref('address-book.add'), {
      url: '/address-book/add/:from/:address/:networkURI',
      views: getViews('address-book.add', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })
    .state($rootScope.sref('address-book.entry'), {
      url: '/address-book/entry/:id',
      views: getViews('address-book.entry', [{
        controller: 'AddressBookEntryCtrl',
        templateUrl: 'views/address-book/entry/entry.html'
      }])
    })
    .state($rootScope.sref('address-book.edit'), {
      url: '/address-book/edit/:id',
      views: getViews('address-book.edit', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })

    /*
     *
     * Request Specific amount
     *
     */

    .state($rootScope.sref('payment-request'), {
      url: '/payment-request',
      abstract: true
    })
    .state($rootScope.sref('payment-request.amount'), {
      url: '/amount/:walletId/:networkURI',
      views: getViews('payment-request.amount', [{
        controller: 'AmountCtrl',
        templateUrl: 'views/send/amount/amount.html'
      }]),
      params: {
        nextStep: $rootScope.sref('payment-request.confirm')
      }
    })
    .state($rootScope.sref('payment-request.confirm'), {
      url: '/confirm/:walletId/:amount/:currency',
      views: getViews('payment-request.confirm', [{
        controller: 'CustomAmountCtrl',
        templateUrl: 'views/receive/custom-amount/custom-amount.html'
      }])
    })

    /*
     *
     * Init backup flow
     *
     */

    .state($rootScope.sref('receive.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('receive.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state($rootScope.sref('receive.backup'), {
      url: '/backup/:walletId',
      views: getViews('receive.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })

    /*
     *
     * Paper Wallet
     *
     */

    .state($rootScope.sref('home.paper-wallet'), {
      url: '/paper-wallet/:privateKey',
      views: getViews('home.paper-wallet', [{
        controller: 'PaperWalletCtrl',
        templateUrl: 'views/paper-wallet/paper-wallet.html'
      }])
    })

    /*
     *
     * Onboarding
     *
     */

    .state($rootScope.sref('onboarding'), {
      url: '/onboarding',
      abstract: true,
      template: '<ion-nav-view name="onboarding"></ion-nav-view>'
    })
    .state($rootScope.sref('onboarding.start'), {
      nativeTransitions: null,
      url: '/onboarding/start',
      views: getViews('onboarding.start', [{
        controller: 'StartCtrl',
        templateUrl: 'views/onboarding/start/start.html'
      }])
    })
    .state($rootScope.sref('onboarding.tour'), {
      url: '/onboarding/tour',
      views: getViews('onboarding.tour', [{
        controller: 'AppTourCtrl',
        templateUrl: 'views/help/tour/tour.html'
      }]),
      params: {
        fromOnboarding: true
      }
    })
    .state($rootScope.sref('onboarding.create-first-wallet'), {
      url: '/onboarding/create-first-wallet',
      views: getViews('onboarding.create-first-wallet', [{
        controller: 'CreateFirstWalletCtrl',
        templateUrl: 'views/onboarding/create-first-wallet/create-first-wallet.html'
      }])
    })
    .state($rootScope.sref('onboarding.collect-email'), {
      url: '/onboarding/collect-email/:walletId',
      views: getViews('onboarding.collect-email', [{
        controller: 'CollectEmailCtrl',
        templateUrl: 'views/onboarding/collect-email/collect-email.html'
      }])
    })
    .state($rootScope.sref('onboarding.backup-request'), {
      url: '/onboarding/backup-request/:walletId',
      views: getViews('onboarding.backup-request', [{
        controller: 'BackupRequestCtrl',
        templateUrl: 'views/onboarding/backup-request/backup-request.html'
      }])
    })
    .state($rootScope.sref('onboarding.backup-warning'), {
      url: '/onboarding/backup-warning/:from/:walletId',
      views: getViews('onboarding.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state($rootScope.sref('onboarding.backup'), {
      url: '/onboarding/backup/:walletId',
      views: getViews('onboarding.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })
    .state($rootScope.sref('onboarding.disclaimer'), {
      url: '/onboarding/disclaimer/:walletId/:backedUp/:resume',
      views: getViews('onboarding.disclaimer', [{
        controller: 'DisclaimerCtrl',
        templateUrl: 'views/onboarding/disclaimer/disclaimer.html'
      }])
    })
    .state($rootScope.sref('onboarding.import'), {
      url: '/onboarding/import',
      views: getViews('onboarding.import', [{
        controller: 'ImportWalletCtrl',
        templateUrl: 'views/add-wallet/import/import.html'
      }]),
      params: {
        code: null,
        fromOnboarding: null
      }
    })

    /*
     *
     * Feedback
     *
     */

    .state($rootScope.sref('feedback'), {
      url: '/feedback',
      views: getViews('feedback', [{
        controller: 'SendFeedbackCtrl',
        templateUrl: 'views/feedback/send/send.html'
      }])
    })
    .state($rootScope.sref('share-app'), {
      url: '/feedback/share-app/:score/:skipped/:fromSettings',
      views: getViews('share-app', [{
        controller: 'FeedbackCompleteCtrl',
        templateUrl: 'views/feedback/complete/complete.html'
      }])
    })
    .state($rootScope.sref('rate'), {
      url: '/feedback/rate',
      abstract: true
    })
    .state($rootScope.sref('rate.send'), {
      url: '/feedback/send/:score',
      views: getViews('rate.send', [{
        controller: 'SendFeedbackCtrl',
        templateUrl: 'views/feedback/send/send.html'
      }])
    })
    .state($rootScope.sref('rate.complete'), {
      url: '/feedback/complete/:score/:skipped',
      views: getViews('rate.complete', [{
        controller: 'FeedbackCompleteCtrl',
        templateUrl: 'views/feedback/complete/complete.html'
      }])
    })
    .state($rootScope.sref('rate.rate-app'), {
      url: '/feedback/rate-app/:score',
      views: getViews('rate.rate-app', [{
        controller: 'RateAppCtrl',
        templateUrl: 'views/feedback/rate-app/rat-app.html'
      }])
    })

    /*
     *
     * Help
     *
     */

    .state($rootScope.sref('help'), {
      url: '/help',
      cache: false,
      views: getViews('help', [{
        controller: 'GetHelpCtrl',
        templateUrl: 'views/help/get-help/get-help.html'
      }]),
      params: {
        fromOnboarding: false
      }
    })
    .state($rootScope.sref('help.tour'), {
      url: '/help/tour',
      views: getViews('help.tour', [{
        controller: 'AppTourCtrl',
        templateUrl: 'views/help/tour/tour.html'
      }]),
      params: {
        fromOnboarding: false
      }
    });
  };

  return root;
});
