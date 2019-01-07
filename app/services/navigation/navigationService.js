'use strict';

angular.module('owsWalletApp.services').factory('navigationService', function($rootScope, $log, lodash, configService, tabClassicRoutes, tabPayRoutes, sideMenuRoutes) {
  var root = {};

  // List of recognized navigation routing schemes.
  var schemes = {
    'side-menu': {
      label: "Side Menu",
      routes: sideMenuRoutes
    },
    'tabs': { // TODO: legacy name, remove
      label: "Tabs Classic",
      routes: tabClassicRoutes,
      show: false
    },
    'tabs-classic': {
      label: "Tabs Classic",
      routes: tabClassicRoutes
    },
    'tabs-pay': {
      label: "Tabs Pay",
      routes: tabPayRoutes
    }
  };

  // Ensure a default scheme is used if configuration fails.
  var currentScheme = 'tabs-classic';

  root.getSchemes = function() {
    var visibleSchemes = lodash.pickBy(schemes, function(v) {
      return v.show != false;
    })
    return Object.keys(visibleSchemes);
  };

  root.schemeLabelFor = function(scheme) {
    return schemes[scheme].label;
  };

  root.init = function(appNavigation, stateProvider) {
    currentScheme = appNavigation.scheme;

    // Select the scheme routing.
    var routes = schemes[currentScheme].routes;
    var map = routes.map;

    if (!routes) {
      throw new Error('Error: app navigation scheme not found: ' + currentScheme);
    }
    $log.info('Using app navigations scheme: ' + root.schemeLabelFor(currentScheme));

    // Provide global access to configuration.
    $rootScope.usingSideMenu = currentScheme.includes('side-menu');
    $rootScope.usingTabs = currentScheme.includes('tabs');
    $rootScope.usingTabClassic = currentScheme.includes('tabs-classic');
    $rootScope.usingTabPay = currentScheme.includes('tabs-pay');

    // Provide global access to map the specified id (a state name) and create a valid ui-sref string.
    $rootScope.sref = function(id, params) {
      id = map.alias[id] || id;

      if (!map.entry[id]) {
        $log.debug('State ' + id + ' not defined for ' + currentScheme);
        return;
      }

      var sref = map.entry[id].stateName;

      if (params) {
        sref += '(' + JSON.stringify(params) + ')';
      }
      return sref;
    };

    // Given a state name, return the app state id (this is a reverse lookup when compared with sref).
    $rootScope.stateId = function(stateName) {
      return lodash.findKey(map.entry, function(entry) {
        return entry.stateName == stateName;
      });
    };

    /**
     * Private functions used to construct the stateProvider.
     */

    var sref = function(id) {
      if (!map.entry[id]) {
        $log.debug('State ' + id + ' not defined for ' + currentScheme);
        return 'no-state-' + Date.now() + Math.random();
      }

      var sref = map.entry[id].stateName;
      return sref;
    };

    var vref = function(id, index) {
      if (!map.entry[id]) {
        return;
      }

      index = index || 0;
      return map.entry[id].viewNames[index];
    };

    // Construct the views for a specified state.
    var getViews = function(stateName, viewObjs) {
      var views = {};
      for (var i=0; i < viewObjs.length; i++) {
        var viewName = vref(stateName, i);
        views[viewName] = viewObjs[i];
      }
      return views;
    };

    var safeStateProvider = {
      state: function(name, stateConfig) {
        if (!lodash.isEmpty(name)) {
          stateProvider.state(name, stateConfig);
        }
        return safeStateProvider;
      }
    };

    /**
     * Set the app routes using state names from the configured app navigation scheme.
     */

    // Initialize the app base routing scheme.
    routes.init(stateProvider);

    safeStateProvider

    /**
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

    /**
     *
     * URI
     *
     */

    .state('uri', {
      url: '/uri/:url',
      controller: function($stateParams, $log, openUrlService, profileService) {
        profileService.whenAvailable(function() {
          $log.info('Deep link from Browser:' + $stateParams.url);
          openUrlService.handleURL({
            url: $stateParams.url
          });
        })
      }
    })

    /**
     *
     * Wallet
     *
     */

    .state(sref('wallet'), {
      url: '/wallet/:walletId/:fromOnboarding',
      views: getViews('wallet', [{
        controller: 'WalletCtrl',
        templateUrl: 'views/wallet/wallet.html'
      }])
    })
    .state(sref('activity'), {
      url: '/activity',
      views: getViews('activity', [{
        controller: 'WalletActivityCtrl',
        templateUrl: 'views/wallets/wallet-activity/wallet-activity.html',
      }])
    })
    .state(sref('proposals'), {
      url: '/proposals',
      views: getViews('proposals', [{
        controller: 'ProposalsCtrl',
        templateUrl: 'views/wallets/proposals/proposals.html',
      }])
    })
    .state(sref('wallet.tx-details'), {
      url: '/tx-details/:walletId/:txid',
      views: getViews('wallet.tx-details', [{
        controller: 'TxDetailsCtrl',
        templateUrl: 'views/wallet/tx-details/tx-details.html'
      }])
    })
    .state(sref('wallet.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('wallet.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state(sref('wallet.backup'), {
      url: '/backup/:walletId',
      views: getViews('wallet.backup', [{
        templateUrl: 'views/backup/backup.html',
        controller: 'BackupCtrl'
      }])
    })
    .state(sref('wallet.addresses'), {
      url: '/addresses/:walletId/:toAddress',
      views: getViews('wallet.addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/addresses.html'
      }])
    })
    .state(sref('wallet.all-addresses'), {
      url: '/all-addresses/:walletId',
      views: getViews('wallet.all-addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/all-addresses/all-addresses.html'
      }])
    })

    /**
     *
     * All Wallets
     *
     */

    .state(sref('all-wallets'), {
      url: '/all-wallets',
      views: getViews('all-wallets', [{
        controller: 'WalletGridCtrl',
        templateUrl: 'views/wallets/layout/wallet-grid/wallet-grid.html'
      }])
    })

    /**
     *
     * Main views
     *
     */

    .state(sref('home'), {
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
    .state(sref('receive'), {
      url: '/receive/:walletId',
      views: getViews('receive', [{
        controller: 'ReceiveCtrl',
        templateUrl: 'views/receive/receive.html',
      }])
    })
    .state(sref('scan'), {
      url: '/scan',
      views: getViews('scan', [{
        controller: 'ScanCtrl',
        templateUrl: 'views/scan/scan.html',
      }])
    })
    .state(sref('send'), {
      url: '/send/:walletId',
      views: getViews('send', [{
        controller: 'SendCtrl',
        templateUrl: 'views/send/send.html',
      }])
    })
    .state(sref('settings'), {
      url: '/settings',
      views: getViews('settings', [{
        controller: 'AppSettingsCtrl',
        templateUrl: 'views/app-settings/settings.html',
      }])
    })

    /**
     *
     * Pass through scan
     *
     */

    .state(sref('scanner'), {
      url: '/scanner',
      params: {
        passthroughMode: true
      },
      controller: 'ScanCtrl',
      templateUrl: 'views/scan/scan.html'
    })

    /**
     *
     * Send
     *
     */

    .state(sref('send.amount'), {
      url: '/amount/:walletId/:networkName/:recipientType/:toAddress/:toName/:toEmail/:toColor',
      views: getViews('send.amount', [{
        controller: 'AmountCtrl',
        templateUrl: 'views/send/amount/amount.html'
      }])
    })
    .state(sref('send.confirm'), {
      url: '/confirm/:walletId/:networkName/:recipientType/:toAddress/:toName/:toAmount/:toEmail/:toColor/:description/:useSendMax',
      views: getViews('send.confirm', [{
        controller: 'ConfirmCtrl',
        templateUrl: 'views/send/confirm/confirm.html'
      }]),
      params: {
        paypro: null
      }
    })
    .state(sref('send.address-book'), {
      url: '/address-book/add/:fromSendTab',
      views: getViews('send.address-book', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })

    /**
     *
     * Add
     *
     */

    .state(sref('add'), {
      url: '/add',
      views: getViews('add', [{
        templateUrl: 'views/add-wallet/add-wallet.html'
      }])
    })
    .state(sref('add.join'), {
      url: '/join/:url',
      views: getViews('add.join', [{
        controller: 'JoinWalletCtrl',
        templateUrl: 'views/add-wallet/join/join.html'
      }])
    })
    .state(sref('add.import'), {
      url: '/import/:code',
      views: getViews('add.import', [{
        controller: 'ImportWalletCtrl',
        templateUrl: 'views/add-wallet/import/import.html'
      }])
    })
    .state(sref('add.create-personal'), {
      url: '/create-personal',
      views: getViews('add.create-personal', [{
        controller: 'CreateWalletCtrl',
        templateUrl: 'views/add-wallet/create/personal/personal.html'
      }])
    })
    .state(sref('add.create-shared'), {
      url: '/create-shared',
      views: getViews('add.create-shared', [{
        controller: 'CreateWalletCtrl',
        templateUrl: 'views/add-wallet/create/shared/shared.html'
      }])
    })

    /**
     *
     * Global Settings
     *
     */

    .state(sref('notifications'), {
      url: '/notifications',
      views: getViews('notifications', [{
        controller: 'NotificationsSettingsCtrl',
        templateUrl: 'views/app-settings/notifications/notifications.html'
      }])
    })
    .state(sref('language'), {
      url: '/language',
      views: getViews('language', [{
        controller: 'LanguageSettingsCtrl',
        templateUrl: 'views/app-settings/language/language.html'
      }])
    })
    .state(sref('networks'), {
      url: '/networks/:id',
      views: getViews('networks', [{
        controller: 'NetworkSettingsCtrl',
        templateUrl: 'views/app-settings/networks/networks.html'
      }])
    })
    .state(sref('network-settings'), {
      url: '/network-settings/:networkName',
      views: getViews('network-settings', [{
        controller: 'NetworkSettingsCtrl',
        templateUrl: 'views/app-settings/networks/networks.html'
      }])
    })
    .state(sref('unit'), {
      url: '/unit/:networkName',
      views: getViews('unit', [{
        controller: 'NetworkUnitSettingsCtrl',
        templateUrl: 'views/app-settings/networks/unit/unit.html'
      }])
    })
    .state(sref('fee'), {
      url: '/fee/:networkName',
      views: getViews('fee', [{
        controller: 'NetworkFeePolicySettingsCtrl',
        templateUrl: 'views/app-settings/networks/fee-policy/fee-policy.html'
      }])
    })
    .state(sref('alternative-currency'), {
      url: '/alternative-currency/:networkName',
      views: getViews('alternative-currency', [{
        controller: 'NetworkAltCurrencySettingsCtrl',
        templateUrl: 'views/app-settings/networks/alt-currency/alt-currency.html'
      }])
    })
    .state(sref('about'), {
      url: '/about',
      views: getViews('about', [{
        controller: 'AboutCtrl',
        templateUrl: 'views/app-settings/about/about.html'
      }])
    })
    .state(sref('about.log'), {
      url: '/logs',
      views: getViews('about.log', [{
        controller: 'SessionLogCtrl',
        templateUrl: 'views/app-settings/session-log/session-log.html'
      }])
    })
    .state(sref('about.terms-of-use'), {
      url: '/terms-of-use',
      views: getViews('about.terms-of-use', [{
        templateUrl: 'views/app-settings/terms-of-use/terms-of-use.html'
      }])
    })
    .state(sref('plugins'), {
      url: '/plugins',
      views: getViews('plugins', [{
        controller: 'PluginsCtrl',
        templateUrl: 'views/app-settings/plugins/plugins.html'
      }])
    })
    .state(sref('plugins.plugin'), {
      url: '/plugin/:id',
      views: getViews('plugins.plugin', [{
        controller: 'PluginSettingsCtrl',
        templateUrl: 'views/app-settings/plugins/plugin/plugin.html'
      }])
    })
    .state(sref('plugins.plugin-others'), {
      url: '/plugin-others',
      views: getViews('plugins.plugin-others', [{
        controller: 'OtherPluginsCtrl',
        templateUrl: 'views/app-settings/plugins/others/others.html'
      }])
    })
    .state(sref('plugins.plugin-details'), {
      url: '/plugin-details/:id',
      views: getViews('plugins.plugin-details', [{
        controller: 'PluginDetailsCtrl',
        templateUrl: 'views/app-settings/plugins/details/details.html'
      }])
    })
    .state(sref('advanced'), {
      url: '/advanced',
      views: getViews('advanced', [{
        controller: 'AdvancedAppSettingsCtrl',
        templateUrl: 'views/app-settings/advanced/advanced.html'
      }])
    })
    .state(sref('advanced.experiments'), {
      url: '/experiments',
      views: getViews('advanced.experiments', [{
        controller: 'ExperimentsAppSettingsCtrl',
        templateUrl: 'views/app-settings/experiments/experiments.html'
      }])
    })
    .state(sref('app-lock'), {
      url: '/app-lock',
      views: getViews('app-lock', [{
        controller: 'AppLockSettingsCtrl',
        templateUrl: 'views/app-settings/app-lock/app-lock.html',
      }])
    })
    .state(sref('passcode'), {
      url: '/passcode/:action',
      views: getViews('passcode', [{
        controller: 'PasscodeCtrl',
        templateUrl: 'views/app-settings/app-lock/passcode/passcode.html',
        cache: false
      }])
    })
    .state(sref('pattern'), {
      url: '/pattern',
      views: getViews('pattern', [{
        controller: 'PatternCtrl',
        templateUrl: 'views/app-settings/app-lock/pattern/pattern.html',
        cache: false
      }])
    })

    /**
     *
     * Wallet preferences
     *
     */

    .state(sref('preferences'), {
      url: '/preferences/:walletId',
      views: getViews('preferences', [{
        controller: 'WalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/wallet-settings.html'
      }])
    })
    .state(sref('preferences.alias'), {
      url: '/preferences/alias/:walletId',
      views: getViews('preferences.alias', [{
        controller: 'WalletAliasSettingsCtrl',
        templateUrl: 'views/wallet-settings/alias/alias.html'
      }])    
    })
    .state(sref('preferences.color'), {
      url: '/preferences/color/:walletId',
      views: getViews('preferences.color', [{
        controller: 'WalletColorSettingsCtrl',
        templateUrl: 'views/wallet-settings/color/color.html'
      }])
    })
    .state(sref('preferences.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('preferences.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state(sref('preferences.backup'), {
      url: '/backup/:walletId',
      views: getViews('preferences.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })
    .state(sref('preferences.advanced'), {
      url: '/preferences/advanced/:walletId',
      views: getViews('preferences.advanced', [{
        controller: 'AdvancedWalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/advanced/advanced.html'
      }])
    })
    .state(sref('preferences.information'), {
      url: '/information/:walletId',
      views: getViews('preferences.information', [{
        controller: 'WalletInformationCtrl',
        templateUrl: 'views/wallet-settings/information/information.html'
      }])
    })
    .state(sref('preferences.export'), {
      url: '/export/:walletId',
      views: getViews('preferences.export', [{
        controller: 'ExportWalletCtrl',
        templateUrl: 'views/wallet-settings/export/export.html'
      }])
    })
    .state(sref('preferences.wallet-service'), {
      url: '/preferences/wallet-service/:walletId',
      views: getViews('preferences.wallet-service', [{
        controller: 'WalletServiceSettingsCtrl',
        templateUrl: 'views/wallet-settings/wallet-service/wallet-service.html'
      }])
    })
    .state(sref('preferences.history'), {
      url: '/preferences/history/:walletId',
      views: getViews('preferences.history', [{
        controller: 'WalletHistorySettingsCtrl',
        templateUrl: 'views/wallet-settings/history/history.html'
      }])
    })
    .state(sref('preferences.external'), {
      url: '/preferences/external-hardware/:walletId',
      views: getViews('preferences.external', [{
        controller: 'ExternalHardwareWalletSettingsCtrl',
        templateUrl: 'views/wallet-settings/external-hardware/external-hardware.html'
      }])
    })
    .state(sref('preferences.delete'), {
      url: '/delete/:walletId',
      views: getViews('preferences.delete', [{
        controller: 'DeleteWalletCtrl',
        templateUrl: 'views/wallet-settings/delete/delete.html'
      }])
    })

    /**
     *
     * Addresses
     *
     */

    .state(sref('settings.addresses'), {
      url: '/addresses/:walletId/:toAddress',
      views: getViews('settings.addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/addresses.html'
      }])
    })
    .state(sref('settings.all-addresses'), {
      url: '/all-addresses/:walletId',
      views: getViews('settings.all-addresses', [{
        controller: 'WalletAddressesCtrl',
        templateUrl: 'views/wallet-settings/addresses/all-addresses/all-addresses.html'
      }])
    })

    /**
     *
     * Copayers
     *
     */

    .state(sref('copayers'), {
      url: '/copayers/:walletId',
      views: getViews('copayers', [{
        controller: 'CopayersCtrl',
        templateUrl: 'views/wallet/copayers/copayers.html'
      }])
    })

    /**
     *
     * Addressbook
     *
     */

    .state(sref('address-book'), {
      url: '/address-book',
      views: getViews('address-book', [{
        controller: 'AddressBookCtrl',
        templateUrl: 'views/address-book/address-book.html'
      }])
    })
    .state(sref('address-book.add'), {
      url: '/address-book/add/:from/:address/:networkName',
      views: getViews('address-book.add', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })
    .state(sref('address-book.entry'), {
      url: '/address-book/entry/:id',
      views: getViews('address-book.entry', [{
        controller: 'AddressBookEntryCtrl',
        templateUrl: 'views/address-book/entry/entry.html'
      }])
    })
    .state(sref('address-book.edit'), {
      url: '/address-book/edit/:id',
      views: getViews('address-book.edit', [{
        controller: 'AddressBookEditCtrl',
        templateUrl: 'views/address-book/edit/edit.html'
      }])
    })

    /**
     *
     * Request Specific amount
     *
     */

    .state(sref('payment-request'), {
      url: '/payment-request',
      abstract: true
    })
    .state(sref('payment-request.amount'), {
      url: '/amount/:walletId/:networkName',
      views: getViews('payment-request.amount', [{
        controller: 'AmountCtrl',
        templateUrl: 'views/send/amount/amount.html'
      }]),
      params: {
        nextStep: 'views/receive/custom-amount/custom-amount.html',
        nextStepTitle: 'Payment Request Amount'
      }
    })

    /**
     *
     * Init backup flow
     *
     */

    .state(sref('receive.backup-warning'), {
      url: '/backup-warning/:from/:walletId',
      views: getViews('receive.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state(sref('receive.backup'), {
      url: '/backup/:walletId',
      views: getViews('receive.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })

    /**
     *
     * Paper Wallet
     *
     */

    .state(sref('wallet.paper-wallet'), {
      url: '/paper-wallet/:privateKey',
      views: getViews('wallet.paper-wallet', [{
        controller: 'PaperWalletCtrl',
        templateUrl: 'views/paper-wallet/paper-wallet.html'
      }])
    })

    /**
     *
     * Onboarding
     *
     */

    .state(sref('onboarding'), {
      url: '/onboarding',
      abstract: true,
      template: '<ion-nav-view name="onboarding"></ion-nav-view>'
    })
    .state(sref('onboarding.start'), {
      url: '/onboarding/start',
      views: getViews('onboarding.start', [{
        controller: 'StartCtrl',
        templateUrl: 'views/onboarding/start/start.html'
      }])
    })
    .state(sref('onboarding.tour'), {
      url: '/onboarding/tour',
      views: getViews('onboarding.tour', [{
        controller: 'AppTourCtrl',
        templateUrl: 'views/help/tour/tour.html'
      }]),
      params: {
        fromOnboarding: true
      }
    })
    .state(sref('onboarding.create-first-wallet'), {
      url: '/onboarding/create-first-wallet',
      views: getViews('onboarding.create-first-wallet', [{
        controller: 'CreateFirstWalletCtrl',
        templateUrl: 'views/onboarding/create-first-wallet/create-first-wallet.html'
      }])
    })
    .state(sref('onboarding.collect-email'), {
      url: '/onboarding/collect-email/:walletId',
      views: getViews('onboarding.collect-email', [{
        controller: 'CollectEmailCtrl',
        templateUrl: 'views/onboarding/collect-email/collect-email.html'
      }])
    })
    .state(sref('onboarding.backup-request'), {
      url: '/onboarding/backup-request/:walletId',
      views: getViews('onboarding.backup-request', [{
        controller: 'BackupRequestCtrl',
        templateUrl: 'views/onboarding/backup-request/backup-request.html'
      }])
    })
    .state(sref('onboarding.backup-warning'), {
      url: '/onboarding/backup-warning/:from/:walletId',
      views: getViews('onboarding.backup-warning', [{
        controller: 'BackupWarningCtrl',
        templateUrl: 'views/backup/warning/warning.html'
      }])
    })
    .state(sref('onboarding.backup'), {
      url: '/onboarding/backup/:walletId',
      views: getViews('onboarding.backup', [{
        controller: 'BackupCtrl',
        templateUrl: 'views/backup/backup.html'
      }])
    })
    .state(sref('onboarding.disclaimer'), {
      url: '/onboarding/disclaimer/:walletId/:backedUp/:resume',
      views: getViews('onboarding.disclaimer', [{
        controller: 'DisclaimerCtrl',
        templateUrl: 'views/onboarding/disclaimer/disclaimer.html'
      }])
    })
    .state(sref('onboarding.import'), {
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

    /**
     *
     * Feedback
     *
     */

    .state(sref('feedback'), {
      url: '/feedback',
      views: getViews('feedback', [{
        controller: 'SendFeedbackCtrl',
        templateUrl: 'views/feedback/send/send.html'
      }])
    })
    .state(sref('share-app'), {
      url: '/feedback/share-app/:score/:skipped/:fromSettings',
      views: getViews('share-app', [{
        controller: 'FeedbackCompleteCtrl',
        templateUrl: 'views/feedback/complete/complete.html'
      }])
    })
    .state(sref('rate'), {
      url: '/feedback/rate',
      abstract: true
    })
    .state(sref('rate.send'), {
      url: '/feedback/send/:score',
      views: getViews('rate.send', [{
        controller: 'SendFeedbackCtrl',
        templateUrl: 'views/feedback/send/send.html'
      }])
    })
    .state(sref('rate.complete'), {
      url: '/feedback/complete/:score/:skipped',
      views: getViews('rate.complete', [{
        controller: 'FeedbackCompleteCtrl',
        templateUrl: 'views/feedback/complete/complete.html'
      }])
    })
    .state(sref('rate.rate-app'), {
      url: '/feedback/rate-app/:score',
      views: getViews('rate.rate-app', [{
        controller: 'RateAppCtrl',
        templateUrl: 'views/feedback/rate-app/rate-app.html'
      }])
    })

    /**
     *
     * Help
     *
     */

    .state(sref('help'), {
      url: '/help',
      views: getViews('help', [{
        controller: 'GetHelpCtrl',
        templateUrl: 'views/help/get-help/get-help.html'
      }]),
      params: {
        fromOnboarding: false
      }
    })
    .state(sref('help.tour'), {
      url: '/help/tour',
      views: getViews('help.tour', [{
        controller: 'AppTourCtrl',
        templateUrl: 'views/help/tour/tour.html'
      }]),
      params: {
        fromOnboarding: false
      }
    })

    /**
     *
     * Dashboard
     *
     */

    .state(sref('dashboard'), {
      url: '/dashboard',
      views: getViews('dashboard', [{
        controller: 'DashboardCtrl',
        templateUrl: 'views/dashboard/dashboard.html'
      }])
    })

    /**
     *
     * Wallets
     *
     */

    .state(sref('wallets'), {
      url: '/wallets',
      views: getViews('wallets', [{
        controller: 'WalletsCtrl',
        templateUrl: 'views/wallets/wallets.html'
      }])
    })

    /**
     *
     * Pay
     *
     */

    .state(sref('pay'), {
      url: '/pay',
      views: getViews('pay', [{
        controller: 'PayCtrl',
        templateUrl: 'views/pay/pay.html'
      }])
    })

    /**
     *
     * Apps
     *
     */

    .state(sref('apps'), {
      url: '/apps',
      views: getViews('apps', [{
        controller: 'AppsCtrl',
        templateUrl: 'views/apps/apps.html'
      }])
    })

    /**
     *
     * More
     *
     */

    .state(sref('more'), {
      url: '/more',
      views: getViews('more', [{
        controller: 'MoreCtrl',
        templateUrl: 'views/more/more.html'
      }])
    });

  };

  return root;
});
