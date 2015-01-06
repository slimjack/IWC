(function (scope) {
    var lockIdPrefix = SJ.iwc.getLocalStoragePrefix() + '_TLOCK_';
    var lockTimeout = 3000;
    var lockWaitTimeout = 50;
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
        var waitTimer = null;

        var tryLock = function () {
            if (executed) return;

            var now = (new Date()).getTime();
            //begin critical section =============================================
            var activeLock = getLock(lockId);
            if (activeLock && now - activeLock.timestamp < lockTimeout) {
                if (!listening) {
                    on(tryLock);
                    listening = true;
                }
                if (waitTimer) { window.clearTimeout(waitTimer); }
                waitTimer = window.setTimeout(tryLock, lockWaitTimeout);
                return;
            }
            executed = true;
            if (listening) { un(tryLock); listening = false; }
            if (waitTimer) { window.clearTimeout(waitTimer); waitTimer = null; }
            setLock(lockId, now);
            //end critical section================================================
            //Wait for some time to be sure that during critical section the lock was not intercepted. And then continue lock flow
            var deferredTimer = window.setTimeout(function () {
                window.clearTimeout(deferredTimer);
                var activeLock = getLock(lockId);
                if (!activeLock || (activeLock.timestamp === now && activeLock.lockerId === lockerId)) {
                    //The lock is successfully captured
                    fn();
                    unlock();
                } else {
                    executed = false;
                    if (!listening) { on(tryLock); listening = true; }
                    waitTimer = window.setTimeout(tryLock, lockWaitTimeout);
                }
            }, 10);//This timeout must be bigger than execution time of critical section.
            //For modern computers critical section execution time is less than 1 ms
        };

        var unlock = function () {
            if (listening) { un(lock); listening = false; }
            if (waitTimer) { window.clearTimeout(waitTimer); waitTimer = null; }
            removeLock(lockId);
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
            fire();//For IE8 and IE9. IE8 and IE9 don't provide any details about storage changes
        }
    };

    scope.interlockedCall = interlockedCall;
})(SJ.ns('iwc.Lock'));