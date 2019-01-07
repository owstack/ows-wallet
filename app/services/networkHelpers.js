'use strict';

angular.module('owsWalletApp.services').factory('networkHelpers', function($log, lodash, appConfig, cryptoService, gettextCatalog, payproService) {
	var root = {};

  root.getExplorer = function(networkName) {
    return {
      name: appConfig.blockchainExplorer[networkName].name,
      url: appConfig.blockchainExplorer[networkName].url,
      urlTx: appConfig.blockchainExplorer[networkName].url + '/tx'
    };
  };

  root.getFeeOptions = function(networkName) {
    // Same fee options for all networks.
    return {
      default: 'normal',
      choices: {
        urgent: gettextCatalog.getString('Urgent'),
        priority: gettextCatalog.getString('Priority'),
        normal: gettextCatalog.getString('Normal'),
        economy: gettextCatalog.getString('Economy'),
        superEconomy: gettextCatalog.getString('Super Economy'),
        custom: gettextCatalog.getString('Custom')
      },
      explainer: {
        heading: gettextCatalog.getString('All transactions include a fee collected by miners on the network.'),
        description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include the transaction in a block. Current fees are determined based on network load and the selected policy.'),
        units: gettextCatalog.getString('Fees are expressed in units \'cost per byte\' (of the transaction message size) and estimate the number of blocks (converted to time) it may take to get the transaction included in a block.')
      }
    };
  };

  root.getRateService = function(networkName) {
    return {
      label: appConfig.rateService[networkName].label,
      url: appConfig.rateService[networkName].url,
      resultSet: '',
      getCode: function(key, val) { return lodash.get(val, 'code') },
      getName: function(key, val) { return lodash.get(val, 'name') },
      getRate: function(key, val) { return lodash.get(val, 'rate') }
    };
  };

  /**
   * tryResolve()
   *
   * Attempt to resolve the specified payment data into its constituents.
   * @param data (String) - a string representing a payment of any form (paypro, url, address...)
   * @param network (Object) - the network to test against.
   * @param walletClient (Object) - the walletClient matching the network.
   * @param cb (Function) - Callback of with a single param (result).
   *
   * var result = {
   *   match: <boolean>
   *   error: <String or undefined>
   *   networkName: <String or undefined>
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
   * networkName - the matching network name.
   * currency - the network currency code.
   * error - a description of any error that occurred after a match was made.
   * address - the currency pay-to address.
   * amount - the amount to send.
   * message - the payment description or memo.
   * paypro - a payment protocol object.
   * privateKey - a private key on networkName.
   *
   * If the data resolved to a paypro object then other fields will be set according to the paypro result.
   */
  root.tryResolve = function(data, network, walletClient, cb) {
    var result = {
      match: false,
      error: undefined,
      networkName: network.name,
      currency: network.currency,
      address: undefined,
      amount: undefined,
      message: undefined,
      isPaymentRequest: undefined,
      paypro: undefined,
      privateKey: undefined
    };

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
    } else if (walletClient.URI.isValid(data)) {
      result.match = true;

      data = sanitizeUri(data);

      var parsed = new walletClient.URI(data);
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
            if (walletClient.Address.isValid(result.address, network.alias)) {
              var addrNetwork = new walletClient.Address(result.address).network;

              if (addrNetwork.name != network.name) {
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
        if (walletClient.Address.isValid(result.address, network.alias)) {
          var addrNetwork = new walletClient.Address(result.address).network;

          if (addrNetwork.name != network.name) {
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
          result.networkName = network.name;
        }
        return cb(result);
      });

    // Plain address.
    } else if (walletClient.Address.isValid(data, network.alias)) {
      result.match = true;
      result.address = data;

      var addrNetwork = new walletClient.Address(data).network;
      if (addrNetwork.name != network.name) {
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

    // Parse a URL that is expected to be a payment protocol endpoint.
    function parsePayPro(data, result, cb) {
      payproService.getPayProDetails(data, network, walletClient, function(err, details) {
        if (err) {
          $log.error('Paypro error: ('+ data + ')' + err);
          result.error = 'Could not resolve payment information.';
        }

        if (details) {
          if (walletClient.Address.isValid(details.toAddress, network.alias)) {
            var addrNetwork = new walletClient.Address(details.toAddress).network;

            if (addrNetwork.name != network.name) {
              result.error = 'Network URI mismatch';
            }

            details.networkName = addrNetwork.name;
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
          cryptoService.PrivateKey(privateKey, network.name);
      } catch (err) {
        return false;
      }
      return true;
    };

  };

	return root;
});
