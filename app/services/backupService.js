'use strict';
angular.module('owsWalletApp.services')
  .factory('backupService', function($log, $timeout, $stateParams, profileService, appConfig, networkService, cryptoService) {

    var root = {};

    var _download = function(ew, filename, cb) {
      var NewBlob = function(data, datatype) {
        var out;

        try {
          out = new Blob([data], {
            type: datatype
          });
          $log.debug("Case 1");
        } catch (e) {
          window.BlobBuilder = window.BlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MozBlobBuilder ||
            window.MSBlobBuilder;

          if (e.name == 'TypeError' && window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(data);
            out = bb.getBlob(datatype);
            $log.debug("Case 2");
          } else if (e.name == "InvalidStateError") {
            // InvalidStateError (tested on FF13 WinXP)
            out = new Blob([data], {
              type: datatype
            });
            $log.debug("Case 3");
          } else {
            // Blob constructor unsupported entirely
            $log.debug("Unsupported");
          }
        }
        return out;
      };

      var a = angular.element('<a></a>');
      var blob = new NewBlob(ew, 'text/plain;charset=utf-8');
      a.attr('href', window.URL.createObjectURL(blob));
      a.attr('download', filename);
      a[0].click();
      return cb();
    };

    root.addMetadata = function(b, opts) {
      b = JSON.parse(b);
      if (opts.addressBook) b.addressBook = opts.addressBook;
      return JSON.stringify(b);
    }

    root.walletExport = function(password, opts) {
      if (!password) {
        return null;
      }
      var wallet = profileService.getWallet($stateParams.walletId);
      try {
        opts = opts || {};
        var b = wallet.export(opts);
        if (opts.addressBook) b = root.addMetadata(b, opts);

        var e = cryptoService.encrypt(password, b, {
          iter: 10000,
          networkName: wallet.networkName // Store the network name in the backup
        });

        return e;
      } catch (err) {
        $log.error('Error exporting wallet: ', err);
        return null;
      };
    };

    root.walletDownload = function(password, opts, cb) {
      var wallet = profileService.getWallet($stateParams.walletId);
      var ew = root.walletExport(password, opts);
      if (!ew) return cb('Could not create backup');

      var walletName = (wallet.alias || '') + (wallet.alias ? '-' : '') + wallet.credentials.walletName;
      if (opts.noSign) walletName = walletName + '-noSign'
      var filename = walletName + '-' + appConfig.nameCase + 'backup.aes.json';
      _download(ew, filename, cb)
    };
    return root;
  });
