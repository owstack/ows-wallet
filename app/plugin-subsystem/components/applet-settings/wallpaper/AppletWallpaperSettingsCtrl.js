'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletWallpaperSettingsCtrl',
  function($rootScope, $log, themeService, themePreferencesService, isMobile, fileStorageService) {

  var self = this;

  this.physicalScreenHeight = function() {
    var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
    return physicalScreenHeight;
  };

  this.currentWallpaperImage = function() {
    // Extract image url from background css
    // E.g., url(/themes/Copay/sidebar-right.png) 50% 0% / contain no-repeat rgb(0, 0, 0)
    var re = /(?:\(['|"]?)(.*?)(?:['|"]?\))/;
    return re.exec(themeService.getPublishedTheme().view.sidebarRBackground)[1];
  };

  this.setDefaultWallpaperImage = function() {
    themePreferencesService.removeThemePreference('view.sidebarRBackground');
  };

  this.openFilePicker = function() {
    var srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
    var options = setOptions(srcType);

    navigator.camera.getPicture(
      function cameraSuccess(imageUrl) {
        if (isMobile.iOS()) {
          // On iOS the returned imageUrl is in tmp storage that is deleted when the app exits.
          // We need to move the image from tmp to permanent storage.
          var newFilename = 'appletsWallpaper-' + new Date().getTime() + '.jpg';
          fileStorageService.move(imageUrl, newFilename, function(error, imageUrl) {
            if (error) {
              $log.debug('Error: unable to obtain image, ' + error);
            }

            // Remove any old wallpaper preference image before setting the new one.
            fileStorageService.remove(self.currentWallpaperImage(), function() {
              saveAndApplyImagePreference(imageUrl);
            });
          });
        } else {
          saveAndApplyImagePreference(imageUrl);
        }
    },
      function cameraError(error) {
        $log.debug('Error: unable to obtain image, ' + error);
    },
    options);
  };

	function setOptions(srcType) {
    var options = {
      // Some common settings are 20, 50, and 100
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      // In this app, dynamically set the picture source, Camera or photo gallery
      sourceType: srcType,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      allowEdit: true,
      correctOrientation: true  //Corrects Android orientation quirks
    }
    return options;
	}

  function saveAndApplyImagePreference(imageUrl) {
    var preferences = {
      'view.sidebarRBackground': 'url(' + imageUrl + ') top / cover no-repeat #000000'
    };

    themePreferencesService.setThemePreferences(preferences);
  };

});
