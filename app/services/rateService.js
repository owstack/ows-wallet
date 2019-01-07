'use strict';

var RateService = function(opts) {
  var self = this;

  opts = opts || {};
  self.httprequest = opts.httprequest;
  self.lodash = opts.lodash;
  self.networkService = opts.networkService;

  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._isAvailable = false;
  self._queued = [];

  // _rates = {
  //  'bch': {
  //    {'EUR': xxxx.xx},
  //    {'USD': xxxx.xx},
  //    ...
  //  },
  //  'btc': {
  //    {'EUR': xxxx.xx},
  //    {'USD': xxxx.xx},
  //    ...
  //  },
  //  ...
  // }
  self._rates = {};

  // _alternative = {
  //   'bch': [
  //     {code: 'EUR', rate: xxxx.xx, name: 'Euro'},
  //     ...
  //   ]
  //   'btc': [
  //     {code: 'EUR', rate: xxxx.xx, name: 'Euro'},
  //     ...
  //   ]
  // }
  self._alternatives = {};

  self._fetchCurrencies();
};

var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype._fetchCurrencies = function() {
  var self = this;

  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;

  var retrieve = function(network) {
    var rateService = network.rateService;
    var networkName = network.name;

    self._rates[networkName] = {};
    self._alternatives[networkName] =[];

    self.httprequest.get(rateService.url).success(function(res) {
      var resultSet = self.lodash.get(res, rateService.resultSet, res);

      self.lodash.each(resultSet, function(val, key) {
        var code = rateService.getCode(key, val);
        var name = rateService.getName(key, val);
        var rate = rateService.getRate(key, val);

        self._rates[networkName][code] = rate;
        self._alternatives[networkName].push({
          name: name,
          isoCode: code,
          rate: rate
        });
      });

      self._isAvailable = true;
      self.lodash.each(self._queued, function(callback) {
        setTimeout(callback, 1);
      });

      setTimeout(function() {
        retrieve(network);
      }, updateFrequencySeconds * 1000);

    }).error(function(err) {
      setTimeout(function() {
        backoffSeconds *= 1.5;
        retrieve(network);
      }, backoffSeconds * 1000);
      return;
    });
  };

  // Get rates for each network using networkService rateService url (default) for each network
  var networks = this.networkService.getNetworks();

  self.lodash.each(networks, function(n) {
    retrieve(n);
  });
};

RateService.prototype.getRate = function(networkName, code) {
  return this._rates[networkName][code];
};

RateService.prototype.getAlternatives = function(networkName) {
  return this._alternatives[networkName];
};

RateService.prototype.isAvailable = function() {
  return this._isAvailable;
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(networkName, atomics, code) {
  if (!this.isAvailable()) {
    return null;
  }
  var network = this.networkService.getNetworkByName(networkName);
  return network.Unit(atomics, 'atomic').toStandardUnit() * this.getRate(networkName, code);
};

RateService.prototype.fromFiat = function(networkName, amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  var network = this.networkService.getNetworkByName(networkName);
  amount = amount / this.getRate(networkName, code);
  return network.Unit(amount, 'standard').toAtomicUnit();
};

RateService.prototype.listAlternatives = function(networkName, sort) {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  var alternatives = self.lodash.map(this.getAlternatives(networkName), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
  if (sort) {
    alternatives.sort(function(a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });
  }
  return self.lodash.uniq(alternatives, 'isoCode');
};

angular.module('owsWalletApp.services').factory('rateService', function($http, lodash, networkService) {
  var cfg = {
    httprequest: $http,
    lodash: lodash,
    networkService: networkService
  };
  return RateService.singleton(cfg);
});
