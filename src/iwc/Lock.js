//https://github.com/slimjack/IWC
(function (scope) {
    var lockIdPrefix = SJ.iwc.getLocalStoragePrefix() + '_LOCK_';
    var lockCheckInterval = 500;
    var activeLocks = [];
    var isInitialized = false;

    SJ.localStorage.onChanged(onStorageChanged);

    var observable = new SJ.utils.Observable();

    function on(fn) {
        observable.on('storagechanged', fn);
    };

    function un(fn) {
        observable.un('storagechanged', fn);
    };

    function fire() {
        observable.fire('storagechanged');
    };

    SJ.windowOn('unload', onWindowUnload);
    clearJunkLocks(function () {
        SJ.iwc.WindowMonitor.onWindowsChanged(function (newWindows, removedWindows) {
            if (removedWindows.length) {
                clearJunkLocks();
            }
        });
        setLocksInitialized();
    });

    function onLocksInitialized (fn) {
        observable.once('locksinitialized', fn);
    };

    function setLocksInitialized() {
        isInitialized = true;
        observable.fire('locksinitialized');
    };

    function captureLock(lockId, callback) {
        var captured = false;
        var released = false;
        var listening = false;
        var listeningTimer = null;
        var lockObject = {
            lockId: lockId,
            release: function () {
                released = true;
                if (listening) {
                    un(lock);
                    listening = false;
                }
                if (captured) {
                    captured = false;
                    removeLock(lockId);
                }
            },
            isCaptured: function () {
                return captured;
            },
            isReleased: function () {
                return released;
            }
        };

        var listen = function () {
            if (!listening) {
                on(tryCapture);
                listeningTimer = window.setInterval(tryCapture, lockCheckInterval);
                listening = true;
            }
        };
        var stopListening = function () {
            if (listening) {
                un(tryCapture);
                window.clearInterval(listeningTimer);
                listening = false;
            }
        };
        var tryCapture = function () {
            if (captured || released) return;
            if (isLockAlreadyCaptured(lockId)) {
                listen();
            } else {
                stopListening();
                SJ.iwc.Lock.interlockedCall(lockId, function () {
                    if (!isLockAlreadyCaptured(lockId)) {
                        setLock(lockObject);
                        captured = true;
                        callback();
                    } else {
                        listen();
                        //Check the lock one more time - possibly the lock was released by closing of owner window during subscription
                        if (!isLockAlreadyCaptured(lockId)) {
                            stopListening();
                            setLock(lockObject);
                            captured = true;
                            callback();
                        }
                    }
                });
            }
        };
        if (!isInitialized) {
            onLocksInitialized(tryCapture);
        } else {
            tryCapture();
        }
        return lockObject;
    };

    function onStorageChanged (event) {
        if (event.key) {
            var valueIsRemoved = !event.newValue && !!event.oldValue;//lock functionality needs to know only about removing of items in localStorage
            if (valueIsRemoved && (event.key.substr(0, lockIdPrefix.length) === lockIdPrefix)) {//checks that event is related to locks
                fire();
            }
        } else {
            fire();//For IE8. IE8 doesn't provide any details about storage changes
        }
    };

    function clearJunkLocks (callback) {
        SJ.iwc.WindowMonitor.onReady(function () {
            SJ.localStorage.forEach(function (itemKey, itemValue) {
                if (itemValue && (itemKey.substr(0, lockIdPrefix.length) === lockIdPrefix)) {
                    var lockId = itemKey.substr(lockIdPrefix.length);
                    if (isJunkLock(lockId, itemValue)) {
                        SJ.iwc.Lock.interlockedCall(lockId, function () {
                            var serializedLock = SJ.localStorage.getItem(itemKey);
                            if (serializedLock && isJunkLock(lockId, serializedLock)) {
                                SJ.localStorage.removeItem(itemKey);
                                fire();
                            }
                        });
                    }
                }
            });
            if (callback) {
                callback();
            }
        });
    };

    function isJunkLock(lockId, serializedLock) {
        var lockInfo = JSON.parse(serializedLock);
        if (!lockInfo || !lockInfo.timestamp || !lockInfo.ownerWindowId) {//junk lock info
            return true;
        }
        var lockBelongsToThisWindow = lockInfo.ownerWindowId === SJ.iwc.WindowMonitor.getThisWindowId();
        var lockBelongsToClosedWindow = !SJ.iwc.WindowMonitor.isWindowOpen(lockInfo.ownerWindowId);
        return lockBelongsToClosedWindow || (lockBelongsToThisWindow && (findLock(lockId) === -1));
    };

    function releaseAllLocks() {
        var locks = [].concat(activeLocks);
        for (var i = 0; i < locks.length; i++) {
            locks[i].release();
        }
    };

    function onWindowUnload() {
        releaseAllLocks();
    };


    function setLock (lockObject) {
        var now = (new Date()).getTime();
        var lockInfo = {
            timestamp: now,
            ownerWindowId: SJ.iwc.WindowMonitor.getThisWindowId()
        };
        var lockCellId = lockIdPrefix + lockObject.lockId;
        SJ.localStorage.setItem(lockCellId, JSON.stringify(lockInfo));
        activeLocks.push(lockObject);
    };

    function removeLock (lockId) {
        var foundIndex = findLock(lockId);
        if (foundIndex !== -1) {
            activeLocks.splice(foundIndex, 1);
        }
        var lockCellId = lockIdPrefix + lockId;
        var serializedData = SJ.localStorage.getItem(lockCellId);
        if (serializedData) {
            var lockInfo = JSON.parse(serializedData);
            if (SJ.iwc.WindowMonitor.getThisWindowId() === lockInfo.ownerWindowId) {
                SJ.localStorage.removeItem(lockCellId);
            }
        }
        fire();
    };

    function isLockAlreadyCaptured (lockId) {
        var lockCellId = lockIdPrefix + lockId;
        var serializedData = SJ.localStorage.getItem(lockCellId);
        if (serializedData) {
            var lockInfo = JSON.parse(serializedData);
            return SJ.iwc.WindowMonitor.isWindowOpen(lockInfo.ownerWindowId);
        }
        return false;
    };

    function findLock(lockId) {
        for (var i = 0; i < activeLocks.length; i++) {
            if (activeLocks[i].lockId === lockId) {
                return i;
            }
        }
        return -1;
    };

    scope.capture = captureLock;
    SJ.lock = captureLock;
})(SJ.ns('iwc.Lock'));
