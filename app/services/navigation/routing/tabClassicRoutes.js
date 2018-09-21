'use strict';

angular.module('owsWalletApp.services').factory('tabClassicRoutes', function() {
  var root = {};

  root.init = function(stateProvider) {
    stateProvider.state('tabsClassic', {
      url: '/tabsClassic',
      abstract: true,
      controller: 'TabsCtrl',
      templateUrl: 'views/navigation/tabs/classic/tabs.html'
    });
  };

  // State map for navigation routing.
  // Use 'alias' to map a state name used in the app implementation to a custom state for this navigation scheme.
  // Each 'entry' represents a well known state name and returns the state and view names for this navigaton scheme.
  root.map = {
    alias: {
      'wallets': 'home'
    },
    entry: {
      'about':                          { stateName: 'tabsClassic.about',                          viewNames: ['tab-settings@tabsClassic'] },
      'about.log':                      { stateName: 'tabsClassic.about.log',                      viewNames: ['tab-settings@tabsClassic'] },
      'about.terms-of-use':             { stateName: 'tabsClassic.about.terms-of-use',             viewNames: ['tab-settings@tabsClassic'] },
      'activity':                       { stateName: 'tabsClassic.activity',                       viewNames: ['tab-home@tabsClassic'] },
      'add':                            { stateName: 'tabsClassic.add',                            viewNames: ['tab-home@tabsClassic'] },
      'add.create-personal':            { stateName: 'tabsClassic.add.create-personal',            viewNames: ['tab-home@tabsClassic'] },
      'add.create-shared':              { stateName: 'tabsClassic.add.create-shared',              viewNames: ['tab-home@tabsClassic'] },
      'add.import':                     { stateName: 'tabsClassic.add.import',                     viewNames: ['tab-home@tabsClassic'] },
      'add.join':                       { stateName: 'tabsClassic.add.join',                       viewNames: ['tab-home@tabsClassic'] },
      'address-book':                   { stateName: 'tabsClassic.address-book',                   viewNames: ['tab-settings@tabsClassic'] },
      'address-book.add':               { stateName: 'tabsClassic.address-book.add',               viewNames: ['tab-settings@tabsClassic'] },
      'address-book.edit':              { stateName: 'tabsClassic.address-book.edit',              viewNames: ['tab-settings@tabsClassic'] },
      'address-book.entry':             { stateName: 'tabsClassic.address-book.entry',             viewNames: ['tab-settings@tabsClassic'] },
      'advanced':                       { stateName: 'tabsClassic.advanced',                       viewNames: ['tab-settings@tabsClassic'] },
      'advanced.experiments':           { stateName: 'tabsClassic.advanced-experiments',           viewNames: ['tab-settings@tabsClassic'] },
      'all-wallets':                    { stateName: 'tabsClassic.home.all-wallets',               viewNames: ['tab-home@tabsClassic'] },
      'alternative-currency':           { stateName: 'tabsClassic.alternative-currency',           viewNames: ['tab-settings@tabsClassic'] },
      'app-lock':                       { stateName: 'tabsClassic.app-lock',                       viewNames: ['tab-settings@tabsClassic'] },
      'copayers':                       { stateName: 'tabsClassic.copayers',                       viewNames: ['tab-home'] },
      'fee':                            { stateName: 'tabsClassic.fee',                            viewNames: ['tab-settings@tabsClassic'] },
      'feedback':                       { stateName: 'tabsClassic.feedback',                       viewNames: ['tab-settings@tabsClassic'] },
      'help':                           { stateName: 'tabsClassic.help',                           viewNames: ['tab-settings@tabsClassic'] },
      'help.tour':                      { stateName: 'tabsClassic.help.tour',                      viewNames: ['tab-settings@tabsClassic'] },
      'home':                           { stateName: 'tabsClassic.home',                           viewNames: ['tab-home'] },
      'language':                       { stateName: 'tabsClassic.language',                       viewNames: ['tab-settings@tabsClassic'] },
      'network-settings':               { stateName: 'tabsClassic.network-settings',               viewNames: ['tab-settings@tabsClassic'] },
      'networks':                       { stateName: 'tabsClassic.networks',                       viewNames: ['tab-settings@tabsClassic'] },
      'notifications':                  { stateName: 'tabsClassic.notifications',                  viewNames: ['tab-settings@tabsClassic'] },
      'onboarding':                     { stateName: 'onboarding',                                 viewNames: null }, // Abstract state
      'onboarding.backup':              { stateName: 'onboarding.backup',                          viewNames: ['onboarding'] },
      'onboarding.backup-request':      { stateName: 'onboarding.backup-request',                  viewNames: ['onboarding'] },
      'onboarding.backup-warning':      { stateName: 'onboarding.backup-warning',                  viewNames: ['onboarding'] },
      'onboarding.collect-email':       { stateName: 'onboarding.collect-email',                   viewNames: ['onboarding'] },
      'onboarding.create-first-wallet': { stateName: 'onboarding.create-first-wallet',             viewNames: ['onboarding'] },
      'onboarding.disclaimer':          { stateName: 'onboarding.disclaimer',                      viewNames: ['onboarding'] },
      'onboarding.import':              { stateName: 'onboarding.import',                          viewNames: ['onboarding'] },
      'onboarding.start':               { stateName: 'onboarding.start',                           viewNames: ['onboarding'] },
      'onboarding.tour':                { stateName: 'onboarding.tour',                            viewNames: ['onboarding'] },
      'payment-request':                { stateName: 'tabsClassic.payment-request',                viewNames: null }, // Abstract state
      'payment-request.amount':         { stateName: 'tabsClassic.payment-request.amount',         viewNames: ['tab-receive@tabsClassic'] },
      'passcode':                       { stateName: 'tabsClassic.passcode',                       viewNames: ['tab-settings@tabsClassic'] },
      'pattern':                        { stateName: 'tabsClassic.pattern',                        viewNames: ['tab-settings@tabsClassic'] },
      'plugins':                        { stateName: 'tabsClassic.plugins',                        viewNames: ['tab-settings@tabsClassic'] },
      'plugins.plugin':                 { stateName: 'tabsClassic.plugins-plugin',                 viewNames: ['tab-settings@tabsClassic'] },
      'plugins.plugin-details':         { stateName: 'tabsClassic.plugins-plugin-details',         viewNames: ['tab-settings@tabsClassic'] },
      'plugins.plugin-others':          { stateName: 'tabsClassic.plugins-plugin-others',          viewNames: ['tab-settings@tabsClassic'] },
      'preferences':                    { stateName: 'tabsClassic.preferences',                    viewNames: ['tab-settings@tabsClassic'] },
      'preferences.advanced':           { stateName: 'tabsClassic.preferences.advanced',           viewNames: ['tab-settings@tabsClassic'] },
      'preferences.alias':              { stateName: 'tabsClassic.preferences.alias',              viewNames: ['tab-settings@tabsClassic'] },
      'preferences.backup':             { stateName: 'tabsClassic.preferences.backup',             viewNames: ['tab-settings@tabsClassic'] },
      'preferences.backup-warning':     { stateName: 'tabsClassic.preferences.backup-warning',     viewNames: ['tab-settings@tabsClassic'] },
      'preferences.color':              { stateName: 'tabsClassic.preferences.color',              viewNames: ['tab-settings@tabsClassic'] },
      'preferences.delete':             { stateName: 'tabsClassic.preferences.delete',             viewNames: ['tab-settings@tabsClassic'] },
      'preferences.export':             { stateName: 'tabsClassic.preferences.export',             viewNames: ['tab-settings@tabsClassic'] },
      'preferences.external':           { stateName: 'tabsClassic.preferences.external',           viewNames: ['tab-settings@tabsClassic'] },
      'preferences.history':            { stateName: 'tabsClassic.preferences.history',            viewNames: ['tab-settings@tabsClassic'] },
      'preferences.information':        { stateName: 'tabsClassic.preferences.information',        viewNames: ['tab-settings@tabsClassic'] },
      'preferences.wallet-service-url': { stateName: 'tabsClassic.preferences.wallet-service-url', viewNames: ['tab-settings@tabsClassic'] },
      'proposals':                      { stateName: 'tabsClassic.proposals',                      viewNames: ['tab-home@tabsClassic'] },
      'rate':                           { stateName: 'tabsClassic.rate',                           viewNames: null }, // Abstract state
      'rate.complete':                  { stateName: 'tabsClassic.rate.complete',                  viewNames: ['tab-home@tabsClassic'] },
      'rate.rate-app':                  { stateName: 'tabsClassic.rate.rate-app',                  viewNames: ['tab-home@tabsClassic'] },
      'rate.send':                      { stateName: 'tabsClassic.rate.send',                      viewNames: ['tab-home@tabsClassic'] },
      'receive':                        { stateName: 'tabsClassic.receive',                        viewNames: ['tab-receive'] },
      'receive.backup':                 { stateName: 'tabsClassic.receive.backup',                 viewNames: ['tab-receive@tabsClassic'] },
      'receive.backup-warning':         { stateName: 'tabsClassic.receive.backup-warning',         viewNames: ['tab-receive@tabsClassic'] },
      'scan':                           { stateName: 'tabsClassic.scan',                           viewNames: ['tab-scan@tabsClassic'] },
      'scanner':                        { stateName: 'scanner',                                    viewNames: null },
      'send':                           { stateName: 'tabsClassic.send',                           viewNames: ['tab-send'] },
      'send.address-book':              { stateName: 'tabsClassic.send.address-book',              viewNames: ['tab-send@tabsClassic'] },
      'send.amount':                    { stateName: 'tabsClassic.send.amount',                    viewNames: ['tab-send@tabsClassic'] },
      'send.confirm':                   { stateName: 'tabsClassic.send.confirm',                   viewNames: ['tab-send@tabsClassic'] },
      'settings':                       { stateName: 'tabsClassic.settings',                       viewNames: ['tab-settings'] },
      'settings.addresses':             { stateName: 'tabsClassic.settings.addresses',             viewNames: ['tab-settings@tabsClassic'] },
      'settings.all-addresses':         { stateName: 'tabsClassic.settings.all-addresses',         viewNames: ['tab-settings@tabsClassic'] },
      'share-app':                      { stateName: 'tabsClassic.share-app',                      viewNames: ['tab-settings@tabsClassic'] },
      'starting':                       { stateName: 'starting',                                   viewNames: null }, // Body
      'unit':                           { stateName: 'tabsClassic.unit',                           viewNames: ['tab-settings@tabsClassic'] },
      'unsupported':                    { stateName: 'unsupported',                                viewNames: null }, // Body
      'uri':                            { stateName: 'uri',                                        viewNames: ['tab-home'] },
      'wallet':                         { stateName: 'tabsClassic.wallet',                         viewNames: ['tab-home'] },
      'wallet.addresses':               { stateName: 'tabsClassic.wallet.addresses',               viewNames: ['tab-home@tabsClassic'] },
      'wallet.all-addresses':           { stateName: 'tabsClassic.wallet.all-addresses',           viewNames: ['tab-home@tabsClassic'] },
      'wallet.backup':                  { stateName: 'tabsClassic.wallet.backup',                  viewNames: ['tab-home@tabsClassic'] },
      'wallet.backup-warning':          { stateName: 'tabsClassic.wallet.backup-warning',          viewNames: ['tab-home@tabsClassic'] },
      'wallet.paper-wallet':            { stateName: 'tabsClassic.wallet.paper-wallet',            viewNames: ['tab-home@tabsClassic'] },
      'wallet.tx-details':              { stateName: 'tabsClassic.wallet.tx-details',              viewNames: ['tab-home@tabsClassic'] }
    }
  };  

  return root;

});
