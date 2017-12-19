'use strict';
angular.module('owsWalletApp.controllers').controller('helpTopicsController',
  function($scope, lodash, helpService) {

    $scope.topics = helpService.getHelpTopics();
    closeAllTopics();

    $scope.init = function(id, locationPrefix) {
      // Expand only the topic if specified
      if (id) {
        closeAllTopics();
        var topic = lodash.find($scope.topics, function(topic) {
          return topic.id == id;
        });
        topic.show = true;
      }

      // Help topics appear in multlple views. We need app wide unique element id's to scroll to the topic ($ionicScrollDelegate)
      $scope.locationPrefix = locationPrefix;
    };

    function closeAllTopics() {
      $scope.topics = lodash.map($scope.topics, function(topic) {
        topic.subtopics = lodash.map(topic.subtopics, function(subtopic) {
          subtopic.show = false;
          return subtopic;
        });
        topic.show = false;
        return topic;
      });
    };
    
    $scope.toggleTopic = function(topic) {
      topic.show = !topic.show;
    };

    $scope.isTopicShown = function(topic) {
      return topic.show;
    };

    $scope.toggleSubtopic = function(subtopic) {
      subtopic.show = !subtopic.show;
    };

    $scope.isSubtopicShown = function(subtopic) {
      return subtopic.show;
    };

  });
