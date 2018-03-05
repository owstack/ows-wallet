'use strict';

angular.module('owsWalletApp.services').factory('sideMenuRoutes', function($rootScope, $ionicSideMenuDelegate) {
  var root = {};

  root.init = function(stateProvider) {
    stateProvider.state('main', {
      url: '/main',
      abstract: true,
      controller: 'SideMenuCtrl',
      templateUrl: 'views/navigation/side-menu/side-menu.html'
    });
  };

  root.sref = function(id) {
    return map[id].stateName;
  };

  root.vref = function(id, index) {
    index = index || 0;
    return map[id].viewNames[index];
  };

  var map = {
    'about':                          { stateName: 'main.about',                          viewNames: ['side-menu-content'] },
    'about.log':                      { stateName: 'main.about-log',                      viewNames: ['side-menu-content'] },
    'about.terms-of-use':             { stateName: 'main.about-terms-of-use',             viewNames: ['side-menu-content'] },
    'activity':                       { stateName: 'main.activity',                       viewNames: ['side-menu-content'] },
    'add':                            { stateName: 'main.add',                            viewNames: ['side-menu-content'] },
    'add.create-personal':            { stateName: 'main.add-create-personal',            viewNames: ['side-menu-content'] },
    'add.create-shared':              { stateName: 'main.add-create-shared',              viewNames: ['side-menu-content'] },
    'add.import':                     { stateName: 'main.add-import',                     viewNames: ['side-menu-content'] },
    'add.join':                       { stateName: 'main.add-join',                       viewNames: ['side-menu-content'] },
    'address-book':                   { stateName: 'main.address-book',                   viewNames: ['side-menu-content'] },
    'address-book.add':               { stateName: 'main.address-book/add',               viewNames: ['side-menu-content'] },
    'address-book.edit':              { stateName: 'main.address-book/edit',              viewNames: ['side-menu-content'] },
    'address-book.entry':             { stateName: 'main.address-book/entry',             viewNames: ['side-menu-content'] },
    'advanced':                       { stateName: 'main.advanced',                       viewNames: ['side-menu-content'] },
    'advanced.experiments':           { stateName: 'main.advanced-experiments',           viewNames: ['side-menu-content'] },
    'alternative-currency':           { stateName: 'main.alternative-currency',           viewNames: ['side-menu-content'] },
    'app-lock':                       { stateName: 'main.app-lock',                       viewNames: ['side-menu-content'] },
    'copayers':                       { stateName: 'main.copayers',                       viewNames: ['side-menu-content'] },
    'fee':                            { stateName: 'main.fee',                            viewNames: ['side-menu-content'] },
    'feedback':                       { stateName: 'main.feedback',                       viewNames: ['side-menu-content'] },
    'help':                           { stateName: 'main.help',                           viewNames: ['side-menu-content'] },
    'help.tour':                      { stateName: 'main.help-tour',                      viewNames: ['side-menu-content'] },
    'home':                           { stateName: 'main.home',                           viewNames: ['side-menu-content'] },
    'home.all-wallets':               { stateName: 'main.home-all-wallets',               viewNames: ['side-menu-content'] },
    'home.paper-wallet':              { stateName: 'main.home-paper-wallet',              viewNames: ['side-menu-content'] },
    'language':                       { stateName: 'main.language',                       viewNames: ['side-menu-content'] },
    'network-settings':               { stateName: 'main.network-settings',               viewNames: ['side-menu-content'] },
    'networks':                       { stateName: 'main.networks',                       viewNames: ['side-menu-content'] },
    'notifications':                  { stateName: 'main.notifications',                  viewNames: ['side-menu-content'] },
    'onboarding':                     { stateName: 'onboarding',                          viewNames: null },
    'onboarding.backup':              { stateName: 'onboarding.backup',                   viewNames: ['onboarding'] },
    'onboarding.backup-request':      { stateName: 'onboarding.backup-request',           viewNames: ['onboarding'] },
    'onboarding.backup-warning':      { stateName: 'onboarding.backup-warning',           viewNames: ['onboarding'] },
    'onboarding.collect-email':       { stateName: 'onboarding.collect-email',            viewNames: ['onboarding'] },
    'onboarding.create-first-wallet': { stateName: 'onboarding.create-first-wallet',      viewNames: ['onboarding'] },
    'onboarding.disclaimer':          { stateName: 'onboarding.disclaimer',               viewNames: ['onboarding'] },
    'onboarding.import':              { stateName: 'onboarding.import',                   viewNames: ['onboarding'] },
    'onboarding.start':               { stateName: 'onboarding.start',                    viewNames: ['onboarding'] },
    'onboarding.tour':                { stateName: 'onboarding.tour',                     viewNames: ['onboarding'] },
    'payment-request':                { stateName: 'main.payment-request',                viewNames: null },
    'payment-request.amount':         { stateName: 'main.payment-request-amount',         viewNames: ['side-menu-content'] },
    'payment-request.confirm':        { stateName: 'main.payment-request-confirm',        viewNames: ['side-menu-content'] },
    'passcode':                       { stateName: 'main.passcode',                       viewNames: ['side-menu-content'] },
    'pattern':                        { stateName: 'tabs.pattern',                        viewNames: ['side-menu-content'] },
    'preferences':                    { stateName: 'main.preferences',                    viewNames: ['side-menu-content'] },
    'preferences.advanced':           { stateName: 'main.preferences-advanced',           viewNames: ['side-menu-content'] },
    'preferences.alias':              { stateName: 'main.preferences-alias',              viewNames: ['side-menu-content'] },
    'preferences.backup':             { stateName: 'main.preferences-backup',             viewNames: ['side-menu-content'] },
    'preferences.backup-warning':     { stateName: 'main.preferences-backup-warning',     viewNames: ['side-menu-content'] },
    'preferences.color':              { stateName: 'main.preferences-color',              viewNames: ['side-menu-content'] },
    'preferences.delete':             { stateName: 'main.preferences-delete',             viewNames: ['side-menu-content'] },
    'preferences.export':             { stateName: 'main.preferences-export',             viewNames: ['side-menu-content'] },
    'preferences.external':           { stateName: 'main.preferences-external',           viewNames: ['side-menu-content'] },
    'preferences.history':            { stateName: 'main.preferences-history',            viewNames: ['side-menu-content'] },
    'preferences.information':        { stateName: 'main.preferences-information',        viewNames: ['side-menu-content'] },
    'preferences.wallet-service-url': { stateName: 'main.preferences-wallet-service-url', viewNames: ['side-menu-content'] },
    'proposals':                      { stateName: 'main.proposals',                      viewNames: ['side-menu-content'] },
    'rate':                           { stateName: 'main.rate',                           viewNames: null },
    'rate.complete':                  { stateName: 'main.rate-complete',                  viewNames: ['side-menu-content'] },
    'rate.rate-app':                  { stateName: 'main.rate-rate-app',                  viewNames: ['side-menu-content'] },
    'rate.send':                      { stateName: 'main.rate-send',                      viewNames: ['side-menu-content'] },
    'receive':                        { stateName: 'main.receive',                        viewNames: ['side-menu-content'] },
    'receive.backup':                 { stateName: 'main.receive-backup',                 viewNames: ['side-menu-content'] },
    'receive.backup-warning':         { stateName: 'main.receive-backup-warning',         viewNames: ['side-menu-content'] },
    'scan':                           { stateName: 'main.scan',                           viewNames: ['side-menu-content'] },
    'scanner':                        { stateName: 'scanner',                             viewNames: null },
    'send':                           { stateName: 'main.send',                           viewNames: ['side-menu-content'] },
    'send.address-book':              { stateName: 'main.send-address-book',              viewNames: ['side-menu-content'] },
    'send.amount':                    { stateName: 'main.send-amount',                    viewNames: ['side-menu-content'] },
    'send.confirm':                   { stateName: 'main.send-confirm',                   viewNames: ['side-menu-content'] },
    'settings':                       { stateName: 'main.settings',                       viewNames: ['side-menu-content'] },
    'settings.addresses':             { stateName: 'main.settings-addresses',             viewNames: ['side-menu-content'] },
    'settings.all-addresses':         { stateName: 'main.settings-all-addresses',         viewNames: ['side-menu-content'] },
    'share-app':                      { stateName: 'main.share-app',                      viewNames: ['side-menu-content'] },
    'starting':                       { stateName: 'starting',                            viewNames: null },
    'unit':                           { stateName: 'main.unit',                           viewNames: ['side-menu-content'] },
    'unsupported':                    { stateName: 'unsupported',                         viewNames: null },
    'uri':                            { stateName: 'uri',                                 viewNames: ['side-menu-content'] },
    'wallet':                         { stateName: 'main.wallet',                         viewNames: ['side-menu-content'] },
    'wallet.addresses':               { stateName: 'main.wallet-addresses',               viewNames: ['side-menu-content'] },
    'wallet.all-addresses':           { stateName: 'main.wallet-all-addresses',           viewNames: ['side-menu-content'] },
    'wallet.backup':                  { stateName: 'main.wallet-backup',                  viewNames: ['side-menu-content'] },
    'wallet.backup-warning':          { stateName: 'main.wallet-backup-warning',          viewNames: ['side-menu-content'] },
    'wallet.tx-details':              { stateName: 'main.wallet-tx-details',              viewNames: ['side-menu-content'] }
  };

  return root;

});