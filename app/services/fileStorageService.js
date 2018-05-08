'use strict';

angular.module('owsWalletApp.services').factory('fileStorageService', function(lodash, $log, platformInfoService) {

  // This service is only available to the following platforms:
  //   - Cordova using cordova-plugin-file (see https://github.com/apache/cordova-plugin-file)
  //   - Browsers supporting File System API (see http://caniuse.com/#feat=filesystem)
  //   

  var root = {};
  var _fs
  var _dir;
  var initialAlloction = 50*1024*1024; // Initial allocation of 50MB of file storage space.
  var maxWriteRetries = 1;
  var writeRetries = maxWriteRetries;

  root.init = function(cb) {
    if (_dir) return cb(null, _fs, _dir);
    root.allocate(initialAlloction, cb);
  };

  root.allocate = function(requestedBytes, cb) {
    function onFileSystemSuccess(fs) {
      _fs = fs;
      if (platformInfoService.isCordova) {
        root.getDir(function(err, newDir) {
          if (err || !newDir.nativeURL) return cb(err);
          _dir = newDir;
          $log.debug('File system started (cordova-plugin-file): ' + fs.name + ' at ' + _dir.nativeURL);
          return cb(null, _fs, _dir);
        });
      } else {
        _dir = fs.root;
        $log.debug('File system started (File System API): ' + fs.name);
        return cb(null, _fs, _dir);
      }
    }

    function fail(error) {
      var msg = 'Could not init file system: ';
      switch (error.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg += 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg += 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg += 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg += 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          msg += 'INVALID_STATE_ERR';
          break;
        default:
          msg += 'Unknown Error';
          break;
      };
      $log.debug(msg);
      return cb(msg);
    };

    if (platformInfoService.isCordova) {
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
    } else {

      // requestFileSystem is prefixed in Google Chrome and Opera.
      window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

      $log.debug('File storage requesting ' + requestedBytes + ' bytes');
      navigator.webkitPersistentStorage.requestQuota(requestedBytes, function(grantedBytes) {
        $log.debug('File storage granted ' + grantedBytes + ' bytes');
        window.requestFileSystem(PERSISTENT, grantedBytes, onFileSystemSuccess, fail);
      }, fail);
    }
  };

  root.get = function(k, cb) {
    root.init(function(err, fs, dir) {
      if (err) return cb(err);
      dir.getFile(k, {
        create: false,
      }, function(fileEntry) {
        if (!fileEntry) return cb();
        fileEntry.file(function(file) {
          var reader = new FileReader();

          reader.onloadend = function(e) {
            return cb(null, this.result)
          }

          reader.readAsText(file);
        });
      }, function(err) {
        // Not found
        if ((platformInfoService.isCordova && err.code == FileError.NOT_FOUND_ERR) ||
          (!platformInfoService.isCordova && err.name == 'NotFoundError')) {
          return cb();
        }
        return cb(err);
      });
    })
  };

  var writelock = {};

  root.set = function(k, v, cb, delay) {
    delay = delay || 100;

    if (writelock[k]) {
      return setTimeout(function() {
        $log.debug('## Writelock for:' + k + ' Retrying in ' + delay);
        return root.set(k, v, cb, delay + 100);
      }, delay);
    }

    writelock[k] = true;
    root.init(function(err, fs, dir) {
      if (err) {
        writelock[k] = false;
        return cb(err);
      }
      dir.getFile(k, {
        create: true,
      }, function(fileEntry) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {
          var truncated = false;

          fileWriter.onwriteend = function(e) {
            if (!truncated) {
                truncated = true;
                this.truncate(this.position);
                return;
            }
            $log.debug('Write completed: ' + k);
            writelock[k] = false;
            return cb();
          };

          fileWriter.onerror = function(e) {
            var err = e.error ? e.error : JSON.stringify(e);
            $log.error('Write failed: ' + err);
            writelock[k] = false;
            return cb('Fail to write:' + err);
          };

          if (lodash.isObject(v))
            v = JSON.stringify(v);

          if (v && !lodash.isString(v)) {
            v = v.toString();
          }

          $log.debug('Writing:', k, v);

          if (platformInfoService.isCordova) {
            fileWriter.write(v);
          } else {

            var blob = new Blob([v], {type: 'text/plain'});

            navigator.webkitPersistentStorage.queryUsageAndQuota (function(usedBytes, grantedBytes) {
              $log.debug('File storage is using ', usedBytes, ' of ', grantedBytes, 'bytes');

              if (blob.size < (grantedBytes - usedBytes)) {
                fileWriter.write(blob);
              } else if (writeRetries > 0) {
                $log.debug('Error: not enough space to write, will attempt to allocate storage and retry...');
                // Retry after allocating 110% of the blob size.
                root.allocate(Math.round(blob.size * 1.1), function() {
                  writeRetries--;
                  root.set(k, v, cb);
                });
              } else {
                writeRetries = maxWriteRetries;
                $log.debug('Error: file storage permanent failure, not enough space to write file');
                fileWriter.onerror('File storage permanent failure, not enough space to write file');
              }

            }, function(e) {
              $log.debug('Error writing file storage', e);
            });

          }
        }, cb);
      }, function(e) {
        $log.debug('Error writing file storage', e);
      });
    });
  };

  root.getAppDir = function() {
    if (platformInfoService.isCordova) {
      var appDir = cordova.file.applicationDirectory;
      if (isMobile.iOS() || isMobile.Android()) {
        // We need the public web directory root.
        appDir += 'www';
      }
      return appDir;
    } else {
      return '';
    }
  };

  // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
  root.getDir = function(cb) {
    if (!cordova.file) {
      return cb('Could not write on device storage');
    }

    var url = cordova.file.dataDirectory;
    // This could be needed for windows
    // if (cordova.file === undefined) {
    //   url = 'ms-appdata:///local/';
    window.resolveLocalFileSystemURL(url, function(dir) {
      return cb(null, dir);
    }, function(err) {
      $log.warn(err);
      return cb(err || 'Could not resolve filesystem:' + url);
    });
  };

  root.remove = function(k, cb) {
    root.init(function(err, fs, dir) {
      if (err) return cb(err);
      dir.getFile(k, {
        create: false,
      }, function(fileEntry) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.remove(function() {
          $log.debug('File removed.');
          return cb();
        }, cb);
      }, cb);
    });
  };

  /**
   * Same as setItem, but fails if an item already exists
   */
  root.create = function(name, value, callback) {
    root.get(name,
      function(err, data) {
        if (data) {
          return callback('EEXISTS');
        } else {
          return root.set(name, value, callback);
        }
      });
  };

  root.move = function(file, newName, cb, overwrite) {
    function resolveSuccess(fileEntry) {
      fileEntry.moveTo(_fs.root, newName, moveSuccess, moveError);
    };

    function moveSuccess(fileEntry) {
      cb(null, fileEntry.nativeURL);
    };

    function moveError(err) {
      var msg = '';
      switch (err.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'INVALID_STATE_ERR';
          break;
        default:
          msg = err.code;
          break;
      };
      $log.debug('Error: could not move file, ' + msg);
      return cb(msg);
    };

    overwrite = overwrite || true;
    root.init(function(err, fs, dir) {
      if (err) return cb(err);
      if (overwrite) {
        root.remove(newName, function() {
          window.resolveLocalFileSystemURL(file, resolveSuccess, moveError);
        });          
      } else {
        window.resolveLocalFileSystemURL(file, resolveSuccess, moveError);
      }
    });
  };

  return root;
});
