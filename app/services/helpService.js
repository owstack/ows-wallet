'use strict';

angular.module('owsWalletApp.services').factory('helpService', function($ionicModal, $ionicScrollDelegate, $location, lodash, gettextCatalog) {
  var root = {};

  // Location prefix used for $ionicScrollDelegate to scroll to view element id.
  root.tourLocationPrefix = 'tour-';

  var tourTopics = [{
      image: 'img/tour/currencies.svg',
      title: gettextCatalog.getString('Use multiple currencies'),
      description: gettextCatalog.getString('You can send, receive, and track multiple digital currencies. One app is all you need.'),
      acknowledgement: gettextCatalog.getString('Got it'),
      sortIndex: 0,
      helpTopicId: 'help-currencies'
    }, {
      image: 'img/tour/wallets.svg',
      title: gettextCatalog.getString('Setup multiple wallets, each with a unique purpose'),
      description: gettextCatalog.getString('Just like bank accounts, you can setup wallets for savings, spending, budgeting, sharing, etc.'),
      acknowledgement: gettextCatalog.getString('I’m my own bank!'),
      sortIndex: 1,
      helpTopicId: 'help-wallets'
    }, {
      image: 'img/tour/share.svg',
      title: gettextCatalog.getString('Share wallets with family, friends, or business associates'),
      description: gettextCatalog.getString('You can start a new shared wallet and invite people to join, or you can join someone else\'s shared wallet. Multiple people must agree to spend money from a shared wallet.'),
      acknowledgement: gettextCatalog.getString('Cool... social spending'),
      sortIndex: 2,
      helpTopicId: 'help-shared-wallets'
    }, {
      image: 'img/tour/backup.svg',
      title: gettextCatalog.getString('Protect your money with safe and secure backups'),
      description: gettextCatalog.getString('There is one private key for each wallet. Export and store it in a safe place. You can use the key later to restore your wallet and spend your money.'),
      acknowledgement: gettextCatalog.getString('I\'m responsible'),
      sortIndex: 3,
      helpTopicId: 'help-backup'
    }, {
      image: 'img/tour/contacts.svg',
      title: gettextCatalog.getString('Add your contacts'),
      description: gettextCatalog.getString('Pay friends and family using money you have in your wallet. Split dinner, send a birthday gift, or just say hello.'),
      acknowledgement: gettextCatalog.getString('I have friends'),
      sortIndex: 4,
      helpTopicId: 'help-contacts'
    }, {
      image: 'img/tour/notifications.svg',
      title: gettextCatalog.getString('Get notified when you receive money'),
      description: gettextCatalog.getString('Transactions are recorded in the public blockchain. When you receive money your wallet will let you know right away.'),
      acknowledgement: gettextCatalog.getString('Thanks for letting me know'),
      sortIndex: 5,
      helpTopicId: 'help-notifications'
    }];

  var helpTopics = [{
    	id: 'help-currencies',
      title: gettextCatalog.getString('Currencies'),
      content: gettextCatalog.getString('You can send, receive, and track multiple digital currencies. One app is all you need.'),
			subtopics: [{
					title: gettextCatalog.getString('What is a digital currency?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What digital currencies can I use with this app?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('How can I get digital currency?'),
					content: gettextCatalog.getString('Answer coming soon')
				}]
    }, {
    	id: 'help-wallets',
      title: gettextCatalog.getString('Wallets'),
      content: gettextCatalog.getString('Just like bank accounts, you can setup wallets for savings, spending, budgeting, sharing, etc.'),
			subtopics: [{
					title: gettextCatalog.getString('What is a wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('Where is my wallet stored?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What infromation is stored in my wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('How many wallets can I have?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('Can I send money between wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('How is by balance calculated?'),
          content: gettextCatalog.getString('By default your wallet shows the total balance, this is the total amount of digital currency stored in this wallet. If there are pending transactions in your wallet then your spendable balance is the total balance less the sum of all pending transaction amounts. Pending transactions include those that are not yet confirmed as well as pending proposals if your wallet is a shared wallet. Confirming transactions have less than 1 blockchain confirmation. Pending transaction proposals in shared wallets allocate funds from the wallet to the transaction. The amount allocated is determined using unspent transaction outputs associated with this wallet and may be more than the actual amounts associated with the sum of your pending transaction proposals in the wallet.')
				}]
    }, {
    	id: 'help-shared-wallets',
      title: gettextCatalog.getString('Shared wallets'),
      content: gettextCatalog.getString('You can start a new shared wallet and invite people to join, or you can join someone else\'s shared wallet. Multiple people must agree to spend money from a shared wallet.'),
			subtopics: [{
					title: gettextCatalog.getString('What is a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('Why would I use a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('Where is a shared wallet stored?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What information stored in a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('How does a spending proposal affect my balance?'),
          content: gettextCatalog.getString('Spending proposals set aside, or lock, a portion of your total wallet balance from being spent elsewhere while the transaction is pending.')
				}]
    }, {
    	id: 'help-backup',
      title: gettextCatalog.getString('Secure wallet backup'),
      content: gettextCatalog.getString('There is one private key for each wallet. Export and store it in a safe place. You can use the key later to restore your wallet and spend your money.'),
			subtopics: [{
					title: gettextCatalog.getString('Why do I need to backup my wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What is the most important thing to know about backing up my wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What should I do if my wallet backup is lost or compromised?'),
					content: gettextCatalog.getString('Answer coming soon')
				}]
    }, {
    	id: 'help-contacts',
      title: gettextCatalog.getString('Contacts'),
      content: gettextCatalog.getString('Pay friends and family using money you have in your wallet. Split dinner, send a birthday gift, or just say hello.'),
			subtopics: [{
					title: gettextCatalog.getString('How do I add a new contact?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('How do I send money to a contact?'),
					content: gettextCatalog.getString('Answer coming soon')
				}]
    }, {
    	id: 'help-notifications',
      title: gettextCatalog.getString('Notifications'),
      content: gettextCatalog.getString('Transactions are recorded in the public blockchain. When you receive money your wallet will let you know right away.'),
			subtopics: [{
					title: gettextCatalog.getString('What notifications will I receive?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('How do I disable/enable notifications?'),
					content: gettextCatalog.getString('Answer coming soon')
				}]
    }, {
    	id: 'help-miner-fees',
      title: gettextCatalog.getString('Miner Fees'),
      content: gettextCatalog.getString('Each transaction you send requires a network miner fee.'),
			subtopics: [{
					title: gettextCatalog.getString('How much is the miner fee?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('Who sets the miner fee?'),
					content: gettextCatalog.getString('Answer coming soon')
				}, {
					title: gettextCatalog.getString('What happens if my miner fee is too low?'),
					content: gettextCatalog.getString('Answer coming soon')
				}]
    }, {
      id: 'help-import',
      title: gettextCatalog.getString('Importing Wallets and Private Keys'),
      content: gettextCatalog.getString('You can import previously exported wallets using a Recovery Phrase or sweep funds from other wallets if you have a Private Key.'),
      subtopics: [{
          title: gettextCatalog.getString('What is a Recovery Phrase?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('I have a Recovery Phrase, how do I recreate my wallet with it?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('How do import a wallet using a Recovery Phrase from third-party software?'),
          content: gettextCatalog.getString('To import a wallet from 3rd party software please use \'Create Personal Wallet\' or \'Create Shared Wallet\'. Choose \'Show advanced options\' then set \'Wallet Key\' to \'Specify Recovery Phrase\'.')
        }, {
          title: gettextCatalog.getString('What is a Private Key?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('Why can\'t I import a Private Key to create a wallet?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('What is funds \'sweeping\' and how do I use a Private Key to do it?'),
          content: gettextCatalog.getString('Answer coming soon')
        }]
    }, {
      id: 'help-export',
      title: gettextCatalog.getString('Exporting Wallets'),
      content: gettextCatalog.getString('There is one private key for each wallet. Export and store it in a safe place. You can use the key later to restore your wallet and spend your money.'),
      subtopics: [{
          title: gettextCatalog.getString('Why do I need to backup my wallets?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('What is the most important thing to know about backing up my wallets?'),
          content: gettextCatalog.getString('Answer coming soon')
        }, {
          title: gettextCatalog.getString('What should I do if my wallet backup is lost or compromised?'),
          content: gettextCatalog.getString('Answer coming soon')
        }]
    }, {
      id: 'help-addresses',
      title: gettextCatalog.getString('Digital Currency Addresses'),
      content: gettextCatalog.getString('An digital currency address is the reference a wallet uses to locate funds associated with the wallet. A wallet may contain one or more addresses.'),
      subtopics: [{
          title: gettextCatalog.getString('Can I use the same address multiple times?'),
          content: gettextCatalog.getString('It is a good idea to avoid reusing addresses. Doing so improves your privacy and keeps your coins secure against hypothetical attacks by quantum computers.')
        }, {
          title: gettextCatalog.getString('What is the unused address limit about?'),
          content: gettextCatalog.getString('Unused addresses are addresses that have no associated transactions. The wallet restore process stops (by design) when 20 addresses are generated in a row each of which contain no funds. To safely generate more addresses, make a payment to one of the unused addresses which has already been generated.')
        }]
    }];

  root.getHelpTopics = function() {
  	return helpTopics;
  };

  root.getTourTopics = function() {
		return lodash.sortBy(tourTopics, function(topic) {
			return topic.sortIndex;
		});
  };

  root.learnMore = function(scope, locationPrefix, topicId) {
    // Conveniently expand the help topic specified
    $ionicModal.fromTemplateUrl('views/help/learn-more/learn-more.html', {
      scope: scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      scope.learnMoreModal = modal;
      scope.learnMoreModal.show();

      // Scroll to relavent help topic
      $location.hash(locationPrefix + topicId);
      $ionicScrollDelegate.anchorScroll();
    });
  };

  return root;

});
