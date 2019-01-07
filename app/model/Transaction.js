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
   * Constructor.
   * @return {Transaction} An instance of Transaction.
   * @constructor
   *
   * To create a Transaction requires the following.
   *
   *   - (A) paypro & feeLevel OR
   *   - (B) address & amount & networkName & feeLevel OR
   *   - (C) address & networkName & feeLevel & useSendmax
   *
   * (A) Pay to the resolved payment protocol using the fee level.
   * 
   * txObj = {
   *   paypro: <Object>,
   *   feeLevel: <String>
   * };
   *
   * (B) Pay the toAmount to the toAddress on the specified network using the fee level.
   *
   * txObj = {
   *   toAddress: <String>,
   *   toAmount: <Number>,
   *   feeLevel: <String>,
   *   networkName: <String>
   * };
   *
   * (B) Pay the wallet's whole balance to the toAddress on the specified network using the fee level.
   *
   * txObj = {
   *   toAddress: <String>,
   *   useSendMax: true,
   *   feeLevel: <String>,
   *   networkName: <String>
   * };
   */
  function Transaction(txObj) {
    var self = this;

    // Avoid requiring networkName when paypro is provided.
    if (txObj.paypro) {
      txObj.networkName = txObj.paypro.networkName;
    }

    self.paypro;
    self.toAddress;
    self.toAmount;
    self.feeLevel;
    self.networkName;
    self.useSendMax;

    lodash.assign(self, txObj);

    // Throws exception if not well formed.
    checkRequired();

    // Optional input properties.
    //
    self.description = self.description || '';
    self.spendUnconfirmed = self.spendUnconfirmed || false;
    self.useSendMax = self.useSendMax || false;

    // Fee properties.
    //
    self.feeLevelName;
    self.feePerKb;
    self.usingCustomFee = false;

    // Derived properties.
    //
    self.amountStr;
    self.amountValueStr;
    self.amountAtomicStr;
    self.alternativeAmountStr;
   
    // Create an internal reference to identify this transaction for the creator.
    self.guid = guid();

    self.shouldConfirm;
    self.walletId;

    var countdown;
    var listener;
    var sendMaxInfo;
    var wallet;

    // A cache of 'dry run' transaction proposals. Avoids having to 'dry run' a transaction more than once.
    var txp = {};
    //
    // End derived properties.

    // Update the transaction amount details.
    updateAmount();

    /**
     * Priviledged functions
     */

    /**
     * Update the fee information and recalculate the transaction.
     * @param {String} level - The fee level to set (e.g. 'normal').
     * @param {Number} feePerKb - The custom fee rate to apply, atomic unit/kB (e.g., satoshis/kB). Only applies if isCustomRate is true.
     * @param {boolean} isCustomRate - Set true if using a custom rate.
     * @param {Function} cb - The callback after the transaction has completed recalculation.
     */
    this.setFee = function(level, feePerKb, isCustomRate, cb) {
      self.feeLevel = level;
      self.feePerKb = feePerKb;
      self.usingCustomFee = isCustomRate;

      update({ clearCache: true, dryRun: true }, cb);
    };

    /**
     * Update the transaction with a new wallet.
     * @param {Object} txWallet - The wallet to apply in the transaction.
     * @param {Function} cb - The callback after the transaction has completed recalculation.
     */
    this.setWallet = function(txWallet, cb) {
      wallet = txWallet;
      self.walletId = wallet.id;

      update({ dryRun: true }, cb);
    };

    /**
     * Get the transactions wallet.
     */
    this.getWallet = function() {
      return wallet;
    };

    this.send = function(cb, statusListener) {
      listener = statusListener || function(){};

      if (self.paymentExpired) {
        err = gettextCatalog.getString('Payment has expired.');
        return cb(err);
      }

      ongoingProcessService.set('creatingTx', true, onStatusChange);
      createTxp(false, function(err, ctxp) {
        ongoingProcessService.set('creatingTx', false, onStatusChange);
        if (err) {
          return cb(err);
        }

        function publishAndSign() {
          if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
            $log.info('No signing proposal: no private key');

            return walletService.onlyPublish(wallet, ctxp, function(err) {
              if (err) {
                $log.error('Transaction.send(): ' + err);
                err = gettextCatalog.getString('Could not publish transaction.');
                return cb(err);
              }
            }, onStatusChange);
          }

          walletService.publishAndSign(wallet, ctxp, function(err, stxp) {
            if (err) {
              $log.error('Transaction.send(): ' + err);
              err = gettextCatalog.getString('Could not publish and sign transaction.');
              return cb(err);
            }

            // Assign our tranaction id.
            self.id = stxp.txid;
            return cb();

          }, onStatusChange);
        };

        publishAndSign();
      });
    };

    /**
     * Private functions
     */

    function guid() {
      return Date.now().toString();
    };

    function checkRequired() {
      var valid = false;

      if (self.feeLevel && self.networkName) {
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

    // Pass custom onGoingProcess events to the callers listener.
    function onStatusChange(processName, showName, isOn) {      
      listener({
        processName: processName,
        showName: showName,
        isOn: isOn
      });
    };

    function updateAmount() {
      if (!self.toAmount) {
        return;
      }

      // Amount
      self.amountStr = txFormatService.formatAmountStr(self.networkName, self.toAmount);
      self.amountValueStr = self.amountStr.split(' ')[0];
      self.amountAtomicStr = self.amountStr.split(' ')[1];
      txFormatService.formatAlternativeStr(self.networkName, self.toAmount, function(v) {
        self.alternativeAmountStr = v;
      });
    };

    function update(opts, cb) {
      if (opts.clearCache) {
        txp = {};
      }

      updateAmount();
      self.shouldConfirm = shouldConfirm();

      // Fee
      //
      ongoingProcessService.set('calculatingFee', true);
      feeService.getFeeRate(self.feeLevel, wallet, function(err, feePerKb) {
        if (err) {
          $log.error('Transaction.update(): ' + err);
          err = gettextCatalog.getString('Could not get fee information.');
          return cb(err);
        }

        if (!self.usingCustomFee) {
          self.feePerKb = feePerKb.atomic;
        }

        self.feeLevelName = feeService.getFeeChoices(wallet.networkName, self.feeLevel);

        ongoingProcessService.set('calculatingFee', false);

        // Send max information
        //
        getSendMaxInfo(function(err, info) {
          if (err) {
            $log.error('Transaction.update(): ' + err);
            err = gettextCatalog.getString('Could not get wallet information.');
            return cb(err);
          }

          if (info) {
            $log.debug('Send max info', info);

            if (self.useSendMax && info.amount == 0) {
              var err = gettextCatalog.getString('Not enough funds available to pay the network fee.');
              return cb(err);
            }

            sendMaxInfo = info;
            self.toAmount = sendMaxInfo.amount;

            updateAmount();

            self.amountBelowFeeStr = txFormatService.formatAmountStr(wallet.networkName, sendMaxInfo.amountBelowFee);
            self.amountAboveMaxSizeStr = txFormatService.formatAmountStr(wallet.networkName, sendMaxInfo.amountAboveMaxSize);
            self.feeStr = txFormatService.formatAmountStr(wallet.networkName, sendMaxInfo.fee);
            self.utxosAboveMaxSize = sendMaxInfo.utxosAboveMaxSize;
            self.utxosBelowFee = sendMaxInfo.utxosBelowFee;
          }

          // If there is a transaction proposal already generated for this wallet then apply it to this transaction object.
          if (txp[wallet.id]) {
            lodash.merge(self, txp[wallet.id]);
            return cb();
          }

          createTxp(opts.dryRun, function(err, ctxp) {
            if (err) {
              return cb(err);
            }

            ctxp.feeStr = txFormatService.formatAmountStr(wallet.networkName, ctxp.fee);
            txFormatService.formatAlternativeStr(wallet.networkName, ctxp.fee, function(v) {
              ctxp.alternativeFeeStr = v;

              var per = (ctxp.fee / (ctxp.amount + ctxp.fee) * 100);
              ctxp.feeRatePerStr = per.toFixed(2) + '%';
              ctxp.feeTooHigh = per > FEE_TOO_HIGH_LIMIT_PER;

              // Cache the txp for this wallet and merge it's properties with this transaction object.
              txp[wallet.id] = ctxp;
              lodash.merge(self, ctxp);

              $log.debug('Transaction fully updated for wallet: ' + wallet.id);

              return cb();
            });

          });
        });
      });
    };

    function shouldConfirm() {
      if (walletService.isEncrypted(wallet)) {
        return false;
      }

      var amountUsd = parseFloat(txFormatService.formatToUSD(wallet.networkName, self.toAmount));
      if (amountUsd <= CONFIRM_LIMIT_USD) {
        return false;
      }

      return true;
    };

    // Create the transaction proposal.
    function createTxp(dryRun, cb) {
      if (self.description && !wallet.credentials.sharedEncryptingKey) {
        var err = gettextCatalog.getString('Could not add message to imported wallet without shared encrypting key.');
        $log.error('Transaction.createTxp(): ' + err);
        cb(err);
      }

      if (self.toAmount > Number.MAX_SAFE_INTEGER) {
        var err = gettextCatalog.getString('Amount too big.');
        $log.error('Transaction.createTxp(): ' + err);
        cb(err);
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
          ntxp.feePerKb = self.feePerKb;
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

      walletService.createTx(wallet, ntxp, function(err, ctxp) {
        if (err) {
          $log.error('Transaction.createTxp(): ' + err);
          err = gettextCatalog.getString('Could not create transaction: ' + err.message);
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
      
      walletService.getSendMaxInfo(wallet, {
        feePerKb: self.feePerKb,
        excludeUnconfirmedUtxos: !self.spendUnconfirmed,
        returnInputs: true,
      }, cb);
    };

    return this;
  };

  return Transaction;
});
