'use strict';

angular.module('owsWalletApp.model').factory('Transaction', function ($log, $interval, lodash, gettextCatalog, walletService,  txFormatService, ongoingProcessService, feeService) {

  /**
   * Transaction
   *
   * Represents a cryptocurrency transaction.
   */

  // Imposed limits
  var CONFIRM_LIMIT_USD = 20;
  var FEE_TOO_HIGH_LIMIT_PER = 15;

  /**
   * Events
   * ======
   *
   * Transaction objects emit events during processing. All events are attached to a single transaction listener function
   * passed into the constructor.
   *
   * Event notifications are invoked with one argument: (event).
   *
   * event = {
   *   id: <number>
   *   data: [optional] <object>
   *   callback: [optional] <function>
   * } 
   *
   * where,
   *
   *   id - the event id, e.g., Transaction.PAYMENT_EXPIRED
   *   data - a data object, if the event sends data
   *   callback - a callback, if the event requires a callback
   *
   *
   * Event objects
   * =============
   *
   * CONFIRM_TX - Used to request a confirmation that a pending transaction should be sent.
   * data: {
   *   amountStr: self.amountStr,
   *   walletName: txWallet.name
   * }
   * callback: user must invoke with one argument: (confirmed)
   *   where,
   *   confirmed <boolean> - true if the transaction should be confirmed, false otherwise.
   * ------------------------------------------
   *
   * CREATE_TX_ERROR - Sent when an error is encountered while creating a transaction.
   * data: {
   *   message: <String>
   * }
   * callback: none
   * ------------------------------------------
   *
   * INSUFFICIENT_FUNDS - Sent when there is not enough money in the wallet to cover the transaction fees.
   * data: none
   * callback: none
   * ------------------------------------------
   *
   * PAYMENT_EXPIRED - Sent when a payment protocol payment request has expired.
   * data: none
   * callback: none
   * ------------------------------------------
   *
   * PAYMENT_TIME_TICK - Sent on each payment protocol timer tick; 1 second interval.
   * data: {
   *   remainingTimeStr: <String>
   * }
   * callback: none
   * ------------------------------------------
   *
   * PUBLISH_ERROR - Sent when an error is encountered while publishing a transaction.
   * data: {
   *   message: <String>
   * }
   * callback: none
   * ------------------------------------------
   *
   * PUBLISH_SIGN_ERROR - Sent when an error is encountered while publishing and signing a transaction.
   * data: {
   *   message: <String>
   * }
   * callback: none
   * ------------------------------------------
   *
   * PUBLISH_SIGN_SUCCESS - Sent when the transaction has been successfully signed.
   * data: none
   * callback: none
   * ------------------------------------------
   *
   * SEND_MAX_FETCH_ERROR - Sent when an error is encountered while fetching wallet send-max information.
   * data: {
   *   message: <String>
   * }
   * callback: none
   * ------------------------------------------
   *
   * SEND_MAX_WARNING - Sent after send max information is computed; notifies of excluded funds due to fees and UTXO concerns.
   * data: {
   *   amountBelowFeeStr: <String>,
   *   amountAboveMaxSizeStr: <String>,
   *   feeStr: <String>,
   *   utxosAboveMaxSize: <Number>,
   *   utxosBelowFee: <Number>,
   *   <sendMaxInfo>
   * }
   * callback: none
   * ------------------------------------------
   *
   * STATUS_CHANGE - Sent when the tranaction has changed status; e.g., creating, signing, boradcasting.
   * data: {
   *   processName: <String>,
   *   showName: <String>,
   *   isOn: <boolean>
   * }
   * callback: none
   * ------------------------------------------
   *
   * TX_DATA_UPDATED - Sent when the transaction was updated; e.g., after changing fees or the wallet.
   * data: none
   * callback: none
   */
  Transaction.CONFIRM_TX = 0;
  Transaction.CREATE_TX_ERROR = 1;
  Transaction.INSUFFICIENT_FUNDS = 2;
  Transaction.PAYMENT_TIME_EXPIRED = 3;
  Transaction.PAYMENT_TIME_TICK = 4;
  Transaction.PUBLISH_ERROR = 5;
  Transaction.PUBLISH_SIGN_ERROR = 6;
  Transaction.PUBLISH_SIGN_SUCCESS = 7;
  Transaction.SEND_MAX_FETCH_ERROR = 8;
  Transaction.SEND_MAX_WARNING = 9;
  Transaction.STATUS_CHANGE = 10;
  Transaction.TX_DATA_UPDATED = 11;

  /**
   * Constructor.
   * @return {Transaction} An instance of Transaction.
   * @constructor
   *
   * To create a Transaction requires the following.
   *
   *   - (A) paypro OR
   *   - (B) address & amount OR
   *   - (C) address & use sendmax
   *
   *   AND
   *
   *   - fee level
   *   - network URI
   * 
   *
   * (A) txObj = {
   *   paypro: <Object>,
   *   feeLevel: <String>,
   *   networkURI: <String>
   * };
   *
   * (B) txObj = {
   *   toAddress: <String>,
   *   toAmount: <Number>,
   *   feeLevel: <String>,
   *   networkURI: <String>
   * };
   *
   * (C) txObj = {
   *   toAddress: <String>,
   *   useSendmax: true,
   *   feeLevel: <String>,
   *   networkURI: <String>
   * };
   */
  function Transaction(txObj, listener) {
    var self = this;

    if (!listener) {
      throw new Error('Transaction listener required');
    }

    lodash.assign(self, txObj);

    // Throws exception if not well formed.
    checkRequired();

    // Optional input properties.
    //
    self.description = self.description || '';
    self.spendUnconfirmed = self.spendUnconfirmed || false;
    self.useSendMax = self.useSendMax || false;

    // Derived properties.
    //
    self.feeLevelName;
    self.feeRate;
    self.usingCustomFee = false;

    self.amountStr;
    self.amountValueStr;
    self.amountAtomicStr;
    self.alternativeAmountStr;
   
    self.paymentExpired = false;
    self.remainingTimeStr;

    var countdown;
    var sendMaxInfo;
    var txWallet;

    // A cache of 'dry run' transaction proposals. Avoids having to 'dry run' a transaction more than once.
    var txp = {};
    //
    // End derived properties.

    // Set payment expiration time if payment protocol is in use.
    if (self.paypro) {
      paymentTimeControl(self.paypro.expires);
    }

    // Update the transaction amount details.
    updateAmount();
    notifyTxDataUpdated();

    /**
     * Priviledged functions
     */

    /**
     * Update the fee information and recalculate the transaction.
     * @param {String} level - The fee level to set (e.g. 'normal').
     * @param {Number} rate - The custom fee rate to apply, atomic unit/kB (e.g., satoshis/kB). Only applies if isCustomRate is true.
     * @param {boolean} isCustomRate - Set true if using a custom rate.
     * @param {Function} cb - The callback after the transaction has completed recalculation.
     *
     * The following events may be sent while this function is in progress.
     *
     * CREATE_TX_ERROR - Sent if there is an error while creating the transaction proposal.
     * INSUFFICIENT_FUNDS - Sent if there is not enough funding in the wallet to pay the network fee.
     * SEND_MAX_FETCH_ERROR - Sent if there is an error while calculating the wallet send max info.
     * SEND_MAX_WARNING - Sent to allow acknowledgement of the fee applied when using send max. This event also provide data
     * related to UTXO participation in the proposed transaction.
     * TX_DATA_UPDATED - Sent when the transaction data has been updated.
     */
    this.setFee = function(level, rate, isCustomRate, cb) {
      self.feeLevel = level;
      self.feeRate = rate;
      self.usingCustomFee = isCustomRate;

      update({ clearCache: true, dryRun: true }, cb);
    };

    /**
     * Update the transaction with a new wallet.
     * @param {Object} wallet - The wallet to apply.
     * @param {Function} cb - The callback after the transaction has completed recalculation.
     * 
     * The following events may be sent while this function is in progress.
     *
     * CREATE_TX_ERROR - Sent if there is an error while creating the transaction proposal.
     * INSUFFICIENT_FUNDS - Sent if there is not enough funding in the wallet to pay the network fee.
     * SEND_MAX_FETCH_ERROR - Sent if there is an error while calculating the wallet send max info.
     * SEND_MAX_WARNING - Sent to allow acknowledgement of the fee applied when using send max. This event also provide data
     * related to UTXO participation in the proposed transaction.
     * TX_DATA_UPDATED - Sent when the transaction data has been updated.
     */
    this.setWallet = function(wallet, cb) {
      txWallet = wallet;

      update({ dryRun: true }, cb);
    };

    /**
     * Attempt to approve the transaction for sending.
     *
     * The following events may be sent while this function is in progress.
     *
     * CONFIRM_TX - Approval must be confirmed when this event is received. Respond to the callback with callback(true) to confirm,
     * callback(false) to deny.
     * CREATE_TX_ERROR - Sent if there is an error while creating the transaction.
     * PAYMENT_EXPIRED - Sent if the transaction is using payment protocol and the payment timer has previously expired.
     * PUBLISH_SIGN_SUCCESS - If approved and no errors occur.
     * PUBLISH_ERROR, PUBLISH_SIGN_ERROR - If approved and errors occur 
     */
    this.approve = function() {
      if (self.paymentExpired) {
        // Notify subscribers of payment expired.
        return notify(Transaction.PAYMENT_EXPIRED);
      }

      ongoingProcessService.set('creatingTx', true, onStatusChange);
      createTxp(false, function(err, ctxp) {
        ongoingProcessService.set('creatingTx', false, onStatusChange);
        if (err) {
          return;
        }

        // Confirm txs for more that 20usd, if not spending/touchid is enabled
        function confirmTx(cb) {
          if (walletService.isEncrypted(txWallet)) {
            return cb();
          }

          var amountUsd = parseFloat(txFormatService.formatToUSD(txWallet.networkURI, ctxp.amount));
          if (amountUsd <= CONFIRM_LIMIT_USD) {
            return cb();
          }

          notify(Transaction.CONFIRM_TX, {
            amountStr: self.amountStr,
            walletName: txWallet.name
          }, function(ok) {
            return cb(!ok);
          });

        };

        function publishAndSign() {
          if (!txWallet.canSign() && !txWallet.isPrivKeyExternal()) {
            $log.info('No signing proposal: No private key');

            return walletService.onlyPublish(txWallet, ctxp, function(err) {
              if (err) {
                // Notify subscriber of publish error.
                notify(Transaction.PUBLISH_ERROR, {
                  message: err
                });
              }
            }, onStatusChange);
          }

          walletService.publishAndSign(txWallet, ctxp, function(err, stxp) {
            if (err) {
              // Notify subscriber of publish and sign error.
              notify(Transaction.PUBLISH_SIGN_ERROR, {
                message: err
              });
            }

            // Assign our tranaction id and notify of success.
            self.id = stxp.txid;
            notify(Transaction.PUBLISH_SIGN_SUCCESS);

          }, onStatusChange);
        };

        confirmTx(function(notOk) {
          if (notOk) {
            return;
          }
          publishAndSign();
        });
      });
    };

    /**
     * Private functions
     */

    function checkRequired() {
      var valid = false;

      if (self.feeLevel && self.networkURI) {
        if (self.paypro ||
          (self.toAddress && self.toAmount) ||
          (self.toAddress && self.useSendMax)) {
          valid = true;
        }
      }

      if (!valid) {
        throw new Error('Cannot construct transaction, invalid combination of properties.');        
      }
    };

    function notify(eventId, data, callback) {
      callback = callback || function(){};

      var event = {
        id: eventId,
        data: data,
        callback: callback
      }

      listener(event);
    };

    // Pass custom onGoingProcess events through our notification service.
    function onStatusChange(processName, showName, isOn) {
      notify(Transaction.STATUS_CHANGE, {
        processName: processName,
        showName: showName,
        isOn: isOn
      });
    };

    function notifyTxDataUpdated() {
      if (txWallet && txp[txWallet.id]) {
        // Fee
        self.feeStr = txp[txWallet.id].feeStr,
        self.alternativeFeeStr = txp[txWallet.id].alternativeFeeStr,
        self.feeRatePerStr = txp[txWallet.id].feeRatePerStr,
        self.feeTooHigh = txp[txWallet.id].feeTooHigh
      };
      notify(Transaction.TX_DATA_UPDATED);
    };

    function updateAmount() {
      if (!self.toAmount) {
        return;
      }

      // Amount
      self.amountStr = txFormatService.formatAmountStr(self.networkURI, self.toAmount);
      self.amountValueStr = self.amountStr.split(' ')[0];
      self.amountAtomicStr = self.amountStr.split(' ')[1];
      txFormatService.formatAlternativeStr(self.networkURI, self.toAmount, function(v) {
        self.alternativeAmountStr = v;

        notifyTxDataUpdated();
      });
    };

    function update(opts, cb) {
      if (opts.clearCache) {
        txp = {};
      }

      updateAmount();

      // Fee
      //
      ongoingProcessService.set('calculatingFee', true);
      feeService.getFeeRate(self.feeLevel, txWallet, function(err, rate) {
        if (err) {
          return cb(err);
        }

        if (!self.usingCustomFee) {
          self.feeRate = rate;
        }

        self.feeLevelName = feeService.getFeeOpts(txWallet.networkURI, self.feeLevel);

        // Send max information
        //
        getSendMaxInfo(function(err, info) {
          ongoingProcessService.set('calculatingFee', false);
          if (err) {
            var err = gettextCatalog.getString('Error getting wallet information.');

            // Notify subscriber of send error.
            notify(Transaction.SEND_MAX_FETCH_ERROR, {
              message: err
            });

            return cb(err);
          }

          if (info) {
            $log.debug('Send max info', info);

            if (self.useSendMax && info.amount == 0) {
              var err = gettextCatalog.getString('Not enough funds available to pay the network fee.');

              // Notify subscriber of insufficient funds in the current wallet.
              notify(Transaction.INSUFFICIENT_FUNDS);

              return cb(err);
            }

            sendMaxInfo = info;
            self.toAmount = sendMaxInfo.amount;

            updateAmount();

            var notifyData = {
              amountBelowFeeStr: txFormatService.formatAmountStr(txWallet.networkURI, sendMaxInfo.amountBelowFee),
              amountAboveMaxSizeStr: txFormatService.formatAmountStr(txWallet.networkURI, sendMaxInfo.amountAboveMaxSize),
              feeStr: txFormatService.formatAmountStr(txWallet.networkURI, sendMaxInfo.fee),
              utxosAboveMaxSize: sendMaxInfo.utxosAboveMaxSize,
              utxosBelowFee: sendMaxInfo.utxosBelowFee
            };

            lodash.merge(notifyData, sendMaxInfo);

            // Notify subscriber of send max warning.
            notify(Transaction.SEND_MAX_WARNING, notifyData);
          }

          // Transaction proposal already generated for this wallet?
          if (txp[txWallet.id]) {
            return cb();
          }

          createTxp(opts.dryRun, function(err, ctxp) {
            if (err) {
              return cb(err);
            }

            ctxp.feeStr = txFormatService.formatAmountStr(txWallet.networkURI, ctxp.fee);
            txFormatService.formatAlternativeStr(txWallet.networkURI, ctxp.fee, function(v) {
              ctxp.alternativeFeeStr = v;
            });

            var per = (ctxp.fee / (ctxp.amount + ctxp.fee) * 100);
            ctxp.feeRatePerStr = per.toFixed(2) + '%';
            ctxp.feeTooHigh = per > FEE_TOO_HIGH_LIMIT_PER;

            // Cache the txp for this wallet.
            txp[txWallet.id] = ctxp;

            notifyTxDataUpdated();

            $log.debug('Transaction fully updated for wallet: ' + txWallet.id);

            return cb();
          });
        });

        notifyTxDataUpdated();
      });
    };

    // Create the transaction proposal.
    function createTxp(dryRun, cb) {
      if (self.description && !txWallet.credentials.sharedEncryptingKey) {
        var err = gettextCatalog.getString('Could not add message to imported wallet without shared encrypting key.');
        $log.error(err);

        // Notify subscriber of send error.
        return notify(Transaction.CREATE_TX_ERROR, {
          message: err
        });
      }

      if (self.toAmount > Number.MAX_SAFE_INTEGER) {
        var err = gettextCatalog.getString('Amount too big.');

        // Notify subscriber of send error.
        return notify(Transaction.CREATE_TX_ERROR, {
          message: err
        });
      }

      // Creating a new txp.
      var ntxp = {};

      ntxp.outputs = [{
        'toAddress': self.toAddress,
        'amount': self.toAmount,
        'message': self.description
      }];

      if (sendMaxInfo) {
        ntxp.inputs = sendMaxInfo.inputs;
        ntxp.fee = sendMaxInfo.fee;
      } else {
        if (self.usingCustomFee) {
          ntxp.feePerKb = self.feeRate;
        } else {
          ntxp.feeLevel = self.feeLevel;
        }
      }

      ntxp.message = self.description;

      if (self.paypro) {
        ntxp.payProUrl = self.paypro.url;
      }

      ntxp.excludeUnconfirmedUtxos = !self.spendUnconfirmed;
      ntxp.dryRun = dryRun;

      walletService.createTx(txWallet, ntxp, function(err, ctxp) {
        if (err) {
          // Notify subscriber of create tx error.
          notify(Transaction.CREATE_TX_ERROR, {
            message: err
          });

          return cb(err);
        }
        return cb(null, ctxp);
      });
    };

    /**
     * Get the send max information the specified wallet.
     */
    function getSendMaxInfo(cb) {
      if (!self.useSendMax) {
        return cb();
      }
      
      walletService.getSendMaxInfo(txWallet, {
        feePerKb: self.feeRate,
        excludeUnconfirmedUtxos: !self.spendUnconfirmed,
        returnInputs: true,
      }, cb);
    };

    // Keeps track of payment expiration time.
    function paymentTimeControl(expirationTime) {
      setExpirationTime();

      countdown = $interval(function() {
        setExpirationTime();
      }, 1000);

      function setExpirationTime() {
        var now = Math.floor(Date.now() / 1000);
        if (now > expirationTime) {
          setExpiredValues();
          return;
        }

        var totalSecs = expirationTime - now;
        var m = Math.floor(totalSecs / 60);
        var s = totalSecs % 60;
        self.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);

        // Notify subscriber of payment time update.
        notify(Transaction.PAYMENT_TIME_TICK, {
          remainingTimeStr: self.remainingTimeStr
        });
      };

      function setExpiredValues() {
        self.paymentExpired = true;
        if (countdown) {
          $interval.cancel(countdown);
        }

        // Notify subscriber of payment expired.
        notify(Transaction.PAYMENT_TIME_EXPIRED);
      };
    };

    return this;
  };

  return Transaction;
});
