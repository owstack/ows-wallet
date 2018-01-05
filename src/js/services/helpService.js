'use strict';

angular.module('owsWalletApp.services').factory('helpService', function(lodash, gettextCatalog) {
  var root = {};

  // Location prefix used for $ionicScrollDelegate to scroll to view element id.
  root.tourLocationPrefix = 'tour-';

  var tourTopics = [
    {
      image: 'img/tour/currencies.svg',
      title: gettextCatalog.getString('Transact using multiple currencies'),
      description: gettextCatalog.getString('You can send, receive, and track multiple cryptocurrencies. One app is all you need.'),
      acknowledgement: gettextCatalog.getString('Got it'),
      sortIndex: 0,
      helpTopicId: 'currencies'
    },
    {
      image: 'img/tour/wallets.svg',
      title: gettextCatalog.getString('Setup multiple wallets, each with a unique purpose'),
      description: gettextCatalog.getString('Just like bank accounts, you can setup wallets for savings, spending, budgeting, sharing, etc.'),
      acknowledgement: gettextCatalog.getString('I’m my own bank!'),
      sortIndex: 1,
      helpTopicId: 'wallets'
    },
    {
      image: 'img/tour/share.svg',
      title: gettextCatalog.getString('Share wallets with family, friends, or business associates'),
      description: gettextCatalog.getString('You can start a new shared wallet and invite people to join, or you can join someone else\'s shared wallet. Multiple people must agree to spend money from a shared wallet.'),
      acknowledgement: gettextCatalog.getString('Cool... social spending'),
      sortIndex: 2,
      helpTopicId: 'shared-wallets'
    },
    {
      image: 'img/tour/backup.svg',
      title: gettextCatalog.getString('Protect your money with safe and secure backups'),
      description: gettextCatalog.getString('There is one private key for each wallet. Export and store it in a safe place. You can use the key later to restore your wallet and spend your money.'),
      acknowledgement: gettextCatalog.getString('I\'m responsible'),
      sortIndex: 3,
      helpTopicId: 'backup'
    },
    {
      image: 'img/tour/contacts.svg',
      title: gettextCatalog.getString('Add your contacts'),
      description: gettextCatalog.getString('Pay friends and family using money you have in your wallet. Split dinner, send a birthday gift, or just say hello.'),
      acknowledgement: gettextCatalog.getString('I have friends'),
      sortIndex: 4,
      helpTopicId: 'contacts'
    },
    {
      image: 'img/tour/notifications.svg',
      title: gettextCatalog.getString('Get notified when you receive money'),
      description: gettextCatalog.getString('Transactions are recorded in the public blockchain. When you receive money your wallet will let you know right away.'),
      acknowledgement: gettextCatalog.getString('Thanks for letting me know'),
      sortIndex: 5,
      helpTopicId: 'notifications'
    }
  ];

  var helpTopics = [
    {
    	id: 'currencies',
      title: gettextCatalog.getString('Currencies'),
      content: gettextCatalog.getString('You can send, receive, and track multiple cryptocurrencies. One app is all you need.'),
			subtopics: [
				{
					title: gettextCatalog.getString('What is a cryptocurrency?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What cryptocurrencies can I use with this app?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('How can I get cryptocurrency?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'wallets',
      title: gettextCatalog.getString('Wallets'),
      content: gettextCatalog.getString('Just like bank accounts, you can setup wallets for savings, spending, budgeting, sharing, etc.'),
			subtopics: [
				{
					title: gettextCatalog.getString('What is a wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('Where is my wallet stored?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What infromation is stored in my wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('How many wallets can I have?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('Can I send money between wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'shared-wallets',
      title: gettextCatalog.getString('Shared wallets'),
      content: gettextCatalog.getString('You can start a new shared wallet and invite people to join, or you can join someone else\'s shared wallet. Multiple people must agree to spend money from a shared wallet.'),
			subtopics: [
				{
					title: gettextCatalog.getString('What is a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('Why would I use a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('Where is a shared wallet stored?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What information stored in a shared wallet?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'backup',
      title: gettextCatalog.getString('Secure wallet backup'),
      content: gettextCatalog.getString('There is one private key for each wallet. Export and store it in a safe place. You can use the key later to restore your wallet and spend your money.'),
			subtopics: [
				{
					title: gettextCatalog.getString('Why do I need to backup my wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What is the most important thing to know about backing up my wallets?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What should I do if my wallet backup is lost or compromised?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'contacts',
      title: gettextCatalog.getString('Contacts'),
      content: gettextCatalog.getString('Pay friends and family using money you have in your wallet. Split dinner, send a birthday gift, or just say hello.'),
			subtopics: [
				{
					title: gettextCatalog.getString('How do I add a new contact?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('How do I send money to a contact?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'notifications',
      title: gettextCatalog.getString('Notifications'),
      content: gettextCatalog.getString('Transactions are recorded in the public blockchain. When you receive money your wallet will let you know right away.'),
			subtopics: [
				{
					title: gettextCatalog.getString('What notifications will I receive?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('How do I disable/enable notifications?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    },
    {
    	id: 'miner-fees',
      title: gettextCatalog.getString('Miner Fees'),
      content: gettextCatalog.getString('Each transaction you send requires a network miner fee.'),
			subtopics: [
				{
					title: gettextCatalog.getString('How much is the miner fee?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('Who sets the miner fee?'),
					content: gettextCatalog.getString('Answer coming soon')
				},
				{
					title: gettextCatalog.getString('What happens if my miner fee is too low?'),
					content: gettextCatalog.getString('Answer coming soon')
				}
			]
    }
  ];

  root.getHelpTopics = function() {
  	return helpTopics;
  };

  root.getTourTopics = function() {
		return lodash.sortBy(tourTopics, function(topic) {
			return topic.sortIndex;
		});
  };

  return root;

});
