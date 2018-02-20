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
  //  'livenet/bch': {
  //    {'EUR': xxxx.xx},
  //    {'USD': xxxx.xx},
  //    ...
  //  },
  //  'livenet/btc': {
  //    {'EUR': xxxx.xx},
  //    {'USD': xxxx.xx},
  //    ...
  //  },
  //  ...
  // }
  self._rates = {};

  // _alternative = {
  //   'livenet/bch': [
  //     {code: 'EUR', rate: xxxx.xx, name: 'Euro'},
  //     ...
  //   ]
  //   'livenet/btc': [
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
    var rateService = network.rateService[network.rateService.default];
    var networkURI = network.getURI();

    self._rates[networkURI] = {};
    self._alternatives[networkURI] =[];

    self.httprequest.get(rateService.url).success(function(res) {
      var resultSet = self.lodash.get(res, rateService.resultSet, res);

      self.lodash.each(resultSet, function(val, key) {
        var code = rateService.getCode(key, val);
        var name = rateService.getName(key, val);
        var rate = rateService.getRate(key, val);

        self._rates[networkURI][code] = rate;
        self._alternatives[networkURI].push({
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

RateService.prototype.getRate = function(networkURI, code) {
  return this._rates[networkURI][code];
};

RateService.prototype.getAlternatives = function(networkURI) {
  return this._alternatives[networkURI];
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

RateService.prototype.toFiat = function(networkURI, atomics, code) {
  if (!this.isAvailable()) {
    return null;
  }
  var asRatio = this.networkService.getASUnitRatio(networkURI);
  return atomics * asRatio * this.getRate(networkURI, code);
};

RateService.prototype.fromFiat = function(networkURI, amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  var asRatio = this.networkService.getASUnitRatio(networkURI);
  return amount / this.getRate(networkURI, code) / asRatio;
};

RateService.prototype.listAlternatives = function(networkURI, sort) {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  var alternatives = self.lodash.map(this.getAlternatives(networkURI), function(item) {
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
