//https://github.com/slimjack/IWC
(function (scope) {
    var lockIdPrefix = SJ.iwc.getLocalStoragePrefix() + '_TLOCK_';
    var lockTimeout = 3 * 1000;
    var lockCheckInterval = 50;
    var lockerId = SJ.generateGUID();

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

    function interlockedCall(lockId, fn) {
        var executed = false;
        var listening = false;
        var listeningTimer = null;
        //if testingMode set, lockTimeout may be defined from outside and lock is not released automatically after fn execution
        var _lockTimeout = scope.testingMode ? scope.lockTimeout || lockTimeout : lockTimeout;

        var listen = function () {
            if (!listening) {
                on(tryLock);
                listeningTimer = window.setInterval(tryLock, lockCheckInterval);
                listening = true;
            }
        };
        var stopListening = function () {
            if (listening) {
                un(tryLock);
                window.clearInterval(listeningTimer);
                listening = false;
            }
        };
        var tryLock = function () {
            if (executed) return;

            var now = (new Date()).getTime();
            //begin critical section =============================================
            var activeLock = getLock(lockId);
            if (activeLock && now - activeLock.timestamp < _lockTimeout) {
                listen();
                return;
            }
            executed = true;
            stopListening();
            setLock(lockId, now);
            //end critical section================================================
            //Wait for some time to be sure that during critical section the lock was not intercepted. And then continue lock flow
            var deferredTimer = window.setTimeout(function () {
                window.clearTimeout(deferredTimer);
                var activeLock = getLock(lockId);
                if (!activeLock || (activeLock.timestamp === now && activeLock.lockerId === lockerId)) {
                    //The lock is successfully captured
                    stopListening();
                    if (!activeLock) {
                        setLock(lockId, now);
                    }
                    fn();
                    if (!scope.testingMode) {
                        removeLock(lockId);
                    }
                } else {
                    //The lock was intercepted
                    executed = false;
                    listen();
                }
            }, 10);//This timeout must be bigger than execution time of critical section.
            //For modern computers critical section execution time is less than 1 ms
        };

        tryLock();
    };

    function getLock (lockId) {
        var lockStorageId = lockIdPrefix + lockId;
        var serializedLock = SJ.localStorage.getItem(lockStorageId);
        var result = null;
        if (serializedLock) {
            var parts = serializedLock.split('.');
            result = {
                timestamp: parseInt(parts[0]) || 0,
                lockerId: parts[1]
            };
        }
        return result;
    };

    function setLock (lockId, timestamp) {
        var lockStorageId = lockIdPrefix + lockId;
        SJ.localStorage.setItem(lockStorageId, timestamp + '.' + lockerId);
    };

    function removeLock (lockId) {
        var lockStorageId = lockIdPrefix + lockId;
        SJ.localStorage.removeItem(lockStorageId);
    };

    function onStorageChanged (event) {
        if (event.key) {
            var valueIsRemoved = !event.newValue && !!event.oldValue;//lock functionality needs to know only about removing of items in localStorage
            if (valueIsRemoved && (event.key.substr(0, lockIdPrefix.length) === lockIdPrefix)) {//check that event is related to locks
                fire();
            }
        } else {
            fire();//For IE8. IE8 doesn't provide any details about storage changes
        }
    };

    scope.interlockedCall = interlockedCall;
    SJ.interlockedCall = interlockedCall;
})(SJ.ns('iwc.Lock'));