'use strict';

angular.module('owsWalletApp.services').factory('addressbookService', function(storageService, lodash, $log, networkService) {
  var root = {};

  var errorSpec = [{
    name: 'READ_AB_ERROR',
    title: 'Error',
    message: 'Could not read the addressbook.'
  }, {
    name: 'REPLACE_AB_ERROR',
    title: 'Error',
    message: 'Could not write the addressbook.'
  }, {
    name: 'REMOVE_AB_ERROR',
    title: 'Error',
    message: 'Could not remove the addressbook.'
  }, {
    name: 'ADD_ENTRY_ERROR',
    title: 'Error',
    message: 'Could not add contact.'
  }, {
    name: 'REMOVE_ENTRY_ERROR',
    title: 'Error',
    message: 'Could not remove contact.'
  }, {
    name: 'ADDRESSBOOK_EMPTY',
    title: 'Error',
    message: 'The addressbook is empty.'
  }, {
    name: 'ENTRY_NOT_FOUND',
    title: 'Error',
    message: 'The contact was not found.'
  }];

  function error(name) {
    return lodash.find(errorSpec, function(e) {
      return e.name == name;
    });
  }

  root.get = function(id, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) {
        return cb(error('READ_AB_ERROR'));
      }

      if (ab) {
        ab = JSON.parse(ab);
      }

      var entry = lodash.find(ab, function(entry) {
        return entry.id == id;
      });

      return cb(null, entry);
    });
  };

  root.list = function(cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) {
        return cb(error('READ_AB_ERROR'));
      }

      if (ab) {
        ab = JSON.parse(ab);
      }
      ab = ab || [];

      return cb(null, ab);
    });
  };

  root.add = function(entry, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) {
        return cb(error('READ_AB_ERROR'));
      }

      if (ab) {
        ab = JSON.parse(ab);
      }
      ab = ab || [];

      ab.push(entry);

      storageService.setAddressbook(angular.toJson(ab), function(err, ab) {
        if (err) {
          return cb(error('ADD_ENTRY_ERROR'));
        }
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.set = function(entry, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) {
        return cb(error('READ_AB_ERROR'));
      }

      if (ab) {
        ab = JSON.parse(ab);
      }
      ab = ab || [];

      ab = lodash.reject(ab, function(e) {
        return e.id == entry.id;
      });
      ab.push(entry);

      storageService.setAddressbook(angular.toJson(ab), function(err, ab) {
        if (err) {
          return cb(error('ADD_ENTRY_ERROR'));
        }
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.setAddressbook = function(ab, cb) {
    storageService.setAddressbook(JSON.stringify(ab), function(err) {
      if (err) {
        return cb(error('REPLACE_AB_ERROR'));
      }
      root.list(function(err, ab) {
        return cb(err, ab);
      });
    });
  };

  root.remove = function(id, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) {
        return cb(error('READ_AB_ERROR'));
      }

      if (ab) {
        ab = JSON.parse(ab);
      }
      ab = ab || [];

      if (lodash.isEmpty(ab)) {
        return cb(error('ADDRESSBOOK_EMPTY'));
      }

      ab = lodash.reject(ab, function(entry) {
        return entry.id == id;
      });

      storageService.setAddressbook(angular.toJson(ab), function(err) {
        if (err) {
          return cb(error('REMOVE_ENTRY_ERROR'));
        }
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function(cb) {
    storageService.removeAddressbook(function(err) {
      if (err) {
        return cb(error('REMOVE_AB_ERROR'));
      }
      return cb();
    });
  };

  root.findInAllByAddress = function(address, cb) {
    root.list(function(err, ab) {
      if (err) {
        $log.error(err.message);
        return cb(err);
      }
      return cb(null, root.findByAddress(ab, address));
    });
  };

  root.findByAddress = function(entries, address) {
    var matchedEntries = [];

    lodash.forEach(entries, function(entry) {
      var matchedAddresses = lodash.find(entry.addresses, function(ea) {
        return ea.address == address;
      });

      if (matchedAddresses && matchedAddresses.length > 0) {
        matchedEntries.push(entry);
      }
    });
    return matchedEntries;
  };

  return root;
});
