'use strict';

angular.module('owsWalletApp.services').factory('networkHelpers', function($log, payproService) {
	var root = {};

  root.getURI = function(obj) {
  	return obj.net + '/' + obj.currency;
  };

  root.getCurrencyLabel = function(obj) {
    return obj.currency.toUpperCase();
  };

  root.getCurrencyLongLabel = function(obj) {
    return obj.name + ' (' + root.getCurrencyLabel(obj) + ')';
  };

  root.getNetLabel = function(obj) {
  	return obj.name + ' (' + obj.net + ')';
  };

  root.getFriendlyNetLabel = function(obj) {
  	return obj.name;
  };

  /**
   * tryResolve()
   *
   * Attempt to resolve the specified payment data into its constituents.
   * @param data (String) - a string representing a payment of any form (paypro, url, address...)
   * @param network (Object) - the network to test against.
   * @param cb (Function) - Callback of with a single param (result).
   *
   * var result = {
   *   match: <boolean>
   *   error: <String or undefined>
   *   networkURI: <String or undefined>
   *   address: <String or undefined>
   *   amount: <Number or undefined>
   *   message: <String or undefined>
   *   paypro: <Object or undefined>
   *   privateKey: <String or undefined>
   * };
   *
   * where,
   *
   * match - whether or not the data is for this network.
   * networkURI - the matching networks URI.
   * currency - the network currency code.
   * error - a description of any error that occurred after a match was made.
   * address - the currency pay-to address.
   * amount - the amount to send.
   * message - the payment description or memo.
   * paypro - a payment protocol object.
   * privateKey - a private key on networkURI.
   *
   * If the data resolved to a paypro object then other fields will be set according to the paypro result.
   */
  root.tryResolve = function(data, network, cb) {
    var result = {
      match: false,
      error: undefined,
      networkURI: network.getURI(),
      currency: network.getCurrencyLabel(),
      address: undefined,
      amount: undefined,
      message: undefined,
      isPaymentRequest: undefined,
      paypro: undefined,
      privateKey: undefined
    };

    var lib = network.walletClient.service.getLib();

    // BIP72 - Payment Protocol with non-backwards-compatible request.
    var re = new RegExp('^' + network.protocol + '?:\\?r=[\\w+]', 'g');
    if (re.exec(data)) {
      result.match = true;

      var protocol = data.split(':')[0];
      var re = new RegExp(network.protocol + '?:\\?r=', 'g');
      data = decodeURIComponent(data.replace(re, ''));

      // Attempt to resolve a payment protocol url.
      return parsePayPro(data, result, cb);

    // BIP21 - Backwards compatible URL, may have payment protocol parameter.
    } else if (lib.URI.isValid(data)) {
      result.match = true;

      data = sanitizeUri(data);

      var parsed = lib.URI(data);
      result.isPaymentRequest = data.startsWith(network.protocol + ':');
      result.address = parsed.address ? parsed.address.toString() : '';
      result.amount = parsed.amount ? parsed.amount : '';
      result.message = parsed.message;

      if (parsed.r) {

        // Attempt to resolve the payment protocol parameter.
        return parsePayPro(parsed.r, result, function(result) {
          // Ignore a paypro resolution error if both an address and amount are defined and valid.
          // This is a fallback scenario.
          if (result.error) {
            result.error = undefined;

            // Validate the address.
            if (lib.Address.isValid(result.address, network.net)) {
              addrNetwork = lib.Address(result.address).network;

              var networkURI = getURIForAddrNetwork(addrNetwork);
              if (networkURI != network.getURI()) {
                result.error = 'network URI mismatch';
              }

            } else {
              result.match = false;
            }
          } 

          return cb(result);
        });

      } else {

        // Validate the address.
        if (lib.Address.isValid(result.address, network.net)) {
          addrNetwork = lib.Address(result.address).network;

          var networkURI = getURIForAddrNetwork(addrNetwork);
          if (networkURI != network.getURI()) {
            result.error = 'network URI mismatch';
          }

        } else {
          result.match = false;
        }

        return cb(result);
      }

    // BIP 70 - Plain URL could be a payment protocol url.
    } else if (/^https?:\/\//.test(data)) {

      // Attempt to resolve as a payment protocol endpoint.
      parsePayPro(data, result, function(result) {
        // If processed successfully without error then paypro endpoint returned a valid payment instruction.
        if (!result.error) {
          result.match = true;
          result.networkURI = network.getURI();
        }
        return cb(result);
      });

    // Plain address.
    } else if (lib.Address.isValid(data, network.net)) {
      result.match = true;
      result.address = data;

      var addrNetwork = lib.Address(data).network;
      var networkURI = getURIForAddrNetwork(addrNetwork);
      if (networkURI != network.getURI()) {
        result.error = 'network URI mismatch';
      }

      return cb(result);

    // Private key
    } else if (data && (data.substring(0, 2) == '6P' || checkPrivateKey(data))) {
      result.match = true;
      result.privateKey = data;

      return cb(result);

    } else {

      // No match
      return cb(result);
    }

    function sanitizeUri(data) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(data);
      if (!match || match.length === 0) {
        return data;
      }
      var value = match[0].replace(',', '.');
      var newUri = data.replace(regex, value);

      // mobile devices, uris like owswallet://blah
      newUri.replace('://', ':');

      return newUri;
    };

    // @param addrNetwork - an address network object
    function getURIForAddrNetwork(addrNetwork) {
      return (addrNetwork.name + '/' + addrNetwork.chainSymbol).toLowerCase();
    };

    // Parse a URL that is expected to be a payment protocol endpoint.
    function parsePayPro(data, result, cb) {
      payproService.getPayProDetails(data, network, function(err, details) {
        if (err) {
          $log.error('Paypro error: ('+ data + ')' + err);
          result.error = 'Could not resolve payment information.';
        }

        if (details) {
          var addrNetwork;

          if (lib.Address.isValid(details.toAddress, network.net)) {
            addrNetwork = lib.Address(details.toAddress).network;

            details.networkURI = getURIForAddrNetwork(addrNetwork);
            if (details.networkURI != network.getURI()) {
              result.error = 'Network URI mismatch';
            }

          } else {
            result.match = false;
          }

          // Return result even if an error occurred.
          result.paypro = details;

          // Fill in values as a convenience.
          result.address = result.paypro.toAddress;
          result.amount = result.paypro.amount;
          result.message = result.paypro.memo;
        }

        cb(result);
      });
    };

    function checkPrivateKey(privateKey) {
      try {
          lib.PrivateKey(privateKey, network.net);
      } catch (err) {
        return false;
      }
      return true;
    };

  };

	return root;
});
