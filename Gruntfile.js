'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  var mode = (grunt.cli.tasks[0] == 'prod' ? 'prod' : 'dev');

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      appConfig: {
        command: 'node ./util/buildAppConfig.js ' + mode
      },
      clean: {
        command: 'rm -Rf bower_components node_modules'
      },
      cordovaclean: {
        command: 'make -C cordova clean'
      },
      macos: {
        command: 'sh webkitbuilds/build-macos.sh sign'
      },
      coveralls: {
        command: 'cat  coverage/report-lcov/lcov.info |./node_modules/coveralls/bin/coveralls.js'
      },
      wpinit: {
        command: 'make -C cordova wp-init',
      },
      wpcopy: {
        command: 'make -C cordova wp-copy',
      },
      iosdebug: {
        command: 'npm run build:ios',
      },
      ios: {
        command: 'npm run build:ios-release',
      },
      xcode: {
        command: 'npm run open:ios',
      },
      androiddebug: {
        command: 'npm run build:android',
      },
      android: {
        command: 'npm run build:android-release',
      },
      androidrun: {
        command: 'npm run run:android && npm run log:android',
      },
      androidbuild: {
        command: 'cd cordova/project && cordova build android --release',
      },
      androidsign: {
        command: 'rm -f cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../ows-wallet.keystore -signedjar cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk  cordova/project/platforms/android/build/outputs/apk/android-release-unsigned.apk ows_wallet_play && ../android-sdk-macosx/build-tools/21.1.1/zipalign -v 4 cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk ',
        stdin: true,
      },
      desktopsign: {
        cmd: 'gpg -u 58711E6C --output "webkitbuilds/<%= pkg.title %>-linux.zip.sig" --detach-sig "webkitbuilds/<%= pkg.title %>-linux.zip" ; gpg -u 58711E6C --output "webkitbuilds/<%= pkg.title %>.exe.sig" --detach-sig "webkitbuilds/<%= pkg.title %>.exe"'
      },
      desktopverify: {
        cmd: 'gpg --verify "webkitbuilds/<%= pkg.title %>-linux.zip.sig" "webkitbuilds/<%= pkg.title %>-linux.zip"; gpg --verify "webkitbuilds/<%= pkg.title %>.exe.sig" "webkitbuilds/<%= pkg.title %>.exe"'
      },
      osxsign: {
        cmd: 'gpg -u 58711E6C --output "webkitbuilds/<%= pkg.title %>.dmg.sig" --detach-sig "webkitbuilds/<%= pkg.title %>.dmg"'
      }
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      sass: {
        files: ['app/**/*.scss'],
        tasks: ['sass']
      },
      main: {
        files: [
          'app/app.init.js',
          'app/app.js',
          'app/shared/**/*.js',
          'app/app.routes.js',
          'app/services/**/*.js',
          'app/model/*.js',
          'app/components/**/*.js',
          'app/plugin-subsystem/**/*.js'
        ],
        tasks: ['concat:js']
      },
      gettext: {
        files: [
          'i18n/po/*.po',
          'i18n/po/*.pot'
        ],
        tasks: ['nggettext_compile','concat']
      },
    },
    sass: {
      dist: {
        options: {
          style: 'compact',
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['app/shared/sass/main.scss'],
          dest: 'www/css/',
          ext: '.css'
        }]
      }
    },
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      components: {
        src: [
          // For express-style routing (plugins)
          'angular-path-to-regexp/angular-path-to-regexp.js',
          // Text translation
          'bower_components/angular-gettext/dist/angular-gettext.js',
          // JS utilities
          'bower_components/ng-lodash/build/ng-lodash.js',
          // Time-ago utilities
          'bower_components/moment/min/moment-with-locales.js',
          'bower_components/angular-moment/angular-moment.js',
          // CSV exporting
          'bower_components/ng-csv/build/ng-csv.js', 
          // MD5 checksum; supports Gravatar
          'bower_components/angular-md5/angular-md5.js',
          // Passwordless authentication using Bitcoin cryptography
          'angular-bitauth/angular-bitauth.js',
          // Dynamic JSON validator
          'node_modules/djv/djv.js',
          'angular-djv/index.js',
          // Create QR codes
          'bower_components/qrcode-generator/js/qrcode.js',
          'bower_components/qrcode-generator/js/qrcode_UTF8.js',
          'bower_components/angular-qrcode/angular-qrcode.js',
          // Touch device directives
          'bower_components/ngtouch/src/ngTouch.js',
          // Copy to OS clipboard
          'bower_components/angular-clipboard/angular-clipboard.js',
          // UI notification overlays
          'bower_components/ionic-toast/dist/ionic-toast.bundle.min.js',
          // Drag-and-drop multi-column grid
          'bower_components/angular-gridster/dist/angular-gridster.min.js',
          // An Android style pattern lock interface
          'bower_components/pattern-lock/angular-pattern-lock.min.js',
          // Network clients
          'angular-bch-wallet-client/angular-bch-wallet-client.js',
          'angular-btc-wallet-client/angular-btc-wallet-client.js',
          //'angular-ltc-wallet-client/angular-ltc-wallet-client.js'
          // Trezor device integration
          'bower_components/trezor-connect/connect.js',
          // Used for slide-to-accept
          'node_modules/bezier-easing/dist/bezier-easing.min.js',
          // Host QR code scanner controls
          'node_modules/cordova-plugin-qrscanner/dist/cordova-plugin-qrscanner-lib.min.js'
        ],
        dest: 'www/lib/components.js'
      },
      app_js: {
        src: [
          'app/app.js',
          'app/app.config.js',
          'app/app.plugincatalog.js',
          'app/app.themecatalog.js',
          'app/app.routes.js',
          'app/shared/**/*.js',
          'app/json-schema/**/*.js',
          'app/model/*.js',
          'app/services/**/*.js',
          'app/components/**/*.js',
          'app/plugin-subsystem/**/*.js',
          'app/app.init.js',
          'app/IndexCtrl.js'
        ],
        dest: 'www/js/app.js'
      },
      app_css: {
        src: [
          'www/css/main.css'
        ],
        dest: 'www/css/main.css'
      },
      plugin_api_js: {
        src: [
          'build/plugin-apis/**/*.js',
        ],
        dest: 'www/lib/ows-wallet-plugin-apis.js'
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'i18n/po/template.pot': [
            'app/**/*.html',
            'app/**/*.js'
          ]
        }
      }
    },
    nggettext_compile: {
      all: {
        options: {
          module: 'owsWalletApp'
        },
        files: {
          'app/shared/translations/translations.js': ['i18n/po/*.po']
        }
      }
    },
    clean: {
      build: ['build/'],
      www: ['www/']
    },
    copy: {
      app_root: {
        expand: true,
        flatten: false,
        cwd: 'app/',
        src: [
          'index.html',
          'cordova.js'
        ],
        dest: 'www/'
      },
      app_views: {
        expand: true,
        flatten: false,
        cwd: 'app/components',
        src: '**/*.html',
        dest: 'www/views/'
      },
      app_views_plugin_subsystem: {
        expand: true,
        flatten: false,
        cwd: 'app/plugin-subsystem/components',
        src: '**/*.html',
        dest: 'www/views/'
      },
      app_shared: {
        expand: true,
        flatten: false,
        cwd: 'app/shared',
        src: '**/*.html',
        dest: 'www/shared/'
      },
      app_fonts: {
        expand: true,
        flatten: false,
        cwd: 'app/assets/fonts',
        src: '**/*',
        dest: 'www/fonts/'
      },
      app_imgs: {
        expand: true,
        flatten: false,
        cwd: 'app/assets/img',
        src: '**/*',
        dest: 'www/img/'
      },
      app_content: {
        expand: true,
        flatten: false,
        cwd: 'app/content',
        src: '**/*.html',
        dest: 'www/content/'
      },
      app_themes: {
        files: [{
          expand: true,
          cwd: 'app/theme-catalog/',
          src: ['**', '!**/*.json'], // Don't bring configuration files into the app
          dest: 'www/theme-catalog/'
        }]
      },
      plugin_client: {
        files: [{
          expand: true,
          flatten: true,
          src: 'node_modules/@owstack/ows-wallet-plugin-client/release/ows-wallet-applet.css',
          dest: 'www/css/'
        }, {
          expand: true,
          flatten: true,
          src: [
            'node_modules/@owstack/ows-wallet-plugin-client/release/ows-wallet-client.min.js',
            'node_modules/@owstack/ows-wallet-plugin-client/release/ows-wallet-applet.min.js',
            'node_modules/@owstack/ows-wallet-plugin-client/release/ows-wallet-servlet.min.js'
          ],
          dest: 'www/lib/'
        }]
      },
      ionic_css: {
        expand: true,
        flatten: true,
        src: [
          'bower_components/ionic/release/css/ionic.min.css',
          'bower_components/animate.css/animate.min.css'
        ],
        dest: 'www/css/'
      },
      ionic_fonts: {
        expand: true,
        flatten: true,
        src: 'bower_components/ionic/release/fonts/ionicons.*',
        dest: 'www/fonts/'
      },
      ionic_js: {
        expand: true,
        flatten: true,
        src: 'bower_components/ionic/release/js/ionic.bundle.min.js',
        dest: 'www/lib/'
      },      
      linux: {
        files: [{
          expand: true,
          cwd: 'webkitbuilds/',
          src: ['.desktop', '../www/img/app/favicon.ico', '../resources/<%= pkg.name %>/linux/512x512.png'],
          dest: 'webkitbuilds/<%= pkg.title %>/linux64/',
          flatten: true,
          filter: 'isFile'
        }]
      }
    },
    nwjs: {
      options: {
        appName: '<%= pkg.title %>',
        platforms: ['win64', 'osx64', 'linux64'],
        buildDir: './webkitbuilds',
        version: '0.19.5',
        macIcns: './resources/<%= pkg.name %>/mac/app.icns',
        exeIco: './www/img/app/logo.ico',
        macPlist: {
          'CFBundleURLTypes': [
            {
              'CFBundleURLName': 'URI Handler',
              'CFBundleURLSchemes': ['bitcoin', '<%= pkg.name %>']
            }
          ]
        }
      },
      src: ['./package.json', './www/**/*']
    },
    compress: {
      linux: {
        options: {
          archive: './webkitbuilds/<%= pkg.title %>-linux.zip'
        },
        expand: true,
        cwd: './webkitbuilds/<%= pkg.title %>/linux64/',
        src: ['**/*'],
        dest: '<%= pkg.title %>-linux/'
      }
    },
    browserify: {
      dist: {
        files: {
          'angular-bitauth/angular-bitauth.js': ['angular-bitauth/index.js'],
          'angular-path-to-regexp/angular-path-to-regexp.js' : ['angular-path-to-regexp/index.js'],
          'angular-bch-wallet-client/angular-bch-wallet-client.js': ['angular-bch-wallet-client/index.js'],
          'angular-btc-wallet-client/angular-btc-wallet-client.js': ['angular-btc-wallet-client/index.js']
          //'angular-ltc-wallet-client/angular-ltc-wallet-client.js': ['angular-ltc-wallet-client/index.js']
        },
        options: {
          exclude: ['www/index.html']
        }
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'www/js/app.js': ['www/js/app.js'],
          'www/lib/components.js': ['www/lib/components.js'],
          'www/lib/ows-wallet-plugin-apis.js': ['www/lib/ows-wallet-plugin-apis.js']
        }
      }
    }
  });

  grunt.registerTask('default', [
    'clean:build',
    'clean:www',
    'nggettext_compile',
    'sass',
    'exec:appConfig',
    'copy:app_root',
    'copy:app_views',
    'copy:app_views_plugin_subsystem',
    'copy:app_shared',
    'copy:app_content',
    'copy:app_fonts',
    'copy:app_imgs',
    'copy:app_themes',
    'copy:plugin_client',
    'copy:ionic_css',
    'copy:ionic_fonts',
    'copy:ionic_js',
    'browserify',
    'concat'
  ]);

  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('desktop', ['prod', 'nwjs', 'copy:linux', 'compress:linux']);
  grunt.registerTask('osx', ['prod', 'nwjs', 'exec:macos', 'exec:osxsign']);
  grunt.registerTask('osx-debug', ['default', 'nwjs']);
  grunt.registerTask('chrome', ['default', 'exec:chrome']);
  grunt.registerTask('wp', ['prod', 'exec:wp']);
  grunt.registerTask('wp-copy', ['default', 'exec:wpcopy']);
  grunt.registerTask('wp-init', ['default', 'exec:wpinit']);
  grunt.registerTask('ios', ['exec:ios']);
  grunt.registerTask('ios-debug', ['exec:iosdebug']);
  grunt.registerTask('ios-run', ['exec:xcode']);
  grunt.registerTask('cordovaclean', ['exec:cordovaclean']);
  grunt.registerTask('android-debug', ['exec:androiddebug', 'exec:androidrun']);
  grunt.registerTask('android', ['exec:android']);
  grunt.registerTask('android-release', ['prod', 'exec:android', 'exec:androidsign']);
  grunt.registerTask('desktopsign', ['exec:desktopsign', 'exec:desktopverify']);

};
