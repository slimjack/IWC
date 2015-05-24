///#source 1 1 /src/sj.js
//https://github.com/slimjack/IWC
var SJ = SJ || {};
SJ.ns = function createNameSpace(namespace) {
    var nsparts = namespace.split(".");
    var parent = SJ;
    if (nsparts[0] === "SJ") {
        nsparts = nsparts.slice(1);
    }
    for (var i = 0; i < nsparts.length; i++) {
        var partname = nsparts[i];
        if (typeof parent[partname] === "undefined") {
            parent[partname] = {};
        }
        parent = parent[partname];
    }
    return parent;
};
///#source 1 1 /src/utils/BasicUtils.js
//https://github.com/slimjack/IWC
(function (scope) {
    var fixedHandlers = {};
    var handlerId = 0;
    var toString = ({}).toString;
    var basicUtils = {
        appName: window.applicationName || 'DEFAULT',
        generateGUID: function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        },

        callback: function (callback) {
            if (SJ.isFunction(callback)) {
                var args = Array.prototype.slice.call(arguments, 1);
                callback.apply(window, args);
            }
        },

        windowOn: function (eventName, handler) {
            handler.handlerId = ++handlerId;
            var fixedHandler = function (event) {
                event = event || window.event;
                handler(event);
            };
            fixedHandlers[handler.handlerId] = handler;
            if (window.addEventListener) {
                window.addEventListener(eventName, fixedHandler, false);
            } else if (window.attachEvent) {
                window.attachEvent('on' + eventName, fixedHandler);
            }
        },

        windowUn: function (eventName, handler) {
            if (window.removeEventListener) {
                window.removeEventListener(eventName, fixedHandlers[handler.handlerId], false);
            } else if (window.detachEvent) {
                window.detachEvent('un' + eventName, fixedHandlers[handler.handlerId]);
            }
            delete fixedHandlers[handler.handlerId];
        },

        isIE: function () {
            var isIE11 = (!(window.ActiveXObject) && ('ActiveXObject' in window));
            if (isIE11) {
                return 11;
            }
            var myNav = navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;
        },

        copy: function (dst, src) {
            var i;
            for (i in src) {
                dst[i] = src[i];
            }

            return dst;
        },

        emptyFn: function() {},

        isEmpty: function (value) {
            return (value == null) || value === '' || (SJ.isArray(value) && value.length === 0);
        },

        isArray: ('isArray' in Array) ? Array.isArray : function (value) {
            return toString.call(value) === '[object Array]';
        },

        isDate: function (value) {
            return toString.call(value) === '[object Date]';
        },

        isObject: function (value) {
            return value !== null && value !== undefined && toString.call(value) === '[object Object]';
        },

        isPrimitive: function (value) {
            var type = typeof value;

            return type === 'number' || type === 'string' || type === 'boolean';
        },

        isFunction: function (value) {
            return !!value && toString.call(value) === '[object Function]';
        },

        isNumber: function (value) {
            return typeof value === 'number' && isFinite(value);
        },

        isNumeric: function (value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },

        isString: function (value) {
            return typeof value === 'string';
        },

        isBoolean: function (value) {
            return typeof value === 'boolean';
        }
    };
    basicUtils.copy(scope, basicUtils);
})(SJ);

///#source 1 1 /src/utils/Object.js
//https://github.com/slimjack/IWC
(function (scope) {
    var ObjectHelper = {
        each: function (obj, fn) {
            for (var propName in obj) {
                if (obj.hasOwnProperty(propName)) {
                    if (fn(obj[propName], propName) === false) {
                        break;
                    }
                }
            }
        }
    };
    SJ.copy(scope, ObjectHelper);
})(SJ.ns('Object'));

///#source 1 1 /src/utils/Observable.js
//https://github.com/slimjack/IWC
(function (scope) {
    function decorate(target) {
        var listeners = {};

        function removeListener(eventName, listener) {
            for (var i = 0; i < listeners[eventName].length; i++) {
                if (listeners[eventName][i] === listener) {
                    listeners[eventName].splice(i, 1);
                }
            }
        }

        function getListener(eventName, listenerFn, scope) {
            var eventListeners = listeners[eventName];
            if (eventListeners) {
                for (var i = 0; i < eventListeners.length; i++) {
                    if (eventListeners[i].fn === listenerFn && eventListeners[i].scope === scope) {
                        return eventListeners[i];
                    }
                }
            }
            return null;
        }

        target.on = function (eventName, listenerFn, scope) {
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            if (!getListener(eventName, listenerFn, scope)) {
                listeners[eventName].push({
                    fn: listenerFn,
                    scope: scope
                });
            }
        };

        target.once = function (eventName, listenerFn, scope) {
            if (!getListener(eventName, listenerFn, scope)) {
                listeners[eventName] = listeners[eventName] || [];
                listeners[eventName].push({
                    fn: listenerFn,
                    scope: scope,
                    single: true
                });
            }
        };

        target.un = function (eventName, listenerFn, scope) {
            var listener = getListener(eventName, listenerFn, scope);
            if (listener) {
                removeListener(eventName, listener);
            }
        };

        target.fire = function (eventName) {
            var eventListeners = listeners[eventName];
            if (eventListeners) {
                eventListeners = [].concat(eventListeners);
                var args = Array.prototype.slice.call(arguments, 1);
                for (var i = 0; i < eventListeners.length; i++) {
                    eventListeners[i].fn.apply(eventListeners[i].scope, args);
                    if (eventListeners[i].single) {
                        removeListener(eventName, eventListeners[i]);
                    }
                }
            }
        };

        return target;
    };

    function Observable() {
        decorate(this);
    };
    Observable.decorate = function (target, onlyPublic) {
        var observable;
        if (onlyPublic) {
            observable = new Observable();
            target.on = observable.on;
            target.un = observable.un;
            target.once = observable.once;
        } else {
            observable = decorate(target);
        }
        return observable;
    };

    scope.Observable = Observable;
})(SJ.ns('utils'));

///#source 1 1 /src/utils/LocalStorage.js
//https://github.com/slimjack/IWC
(function (scope) {
    //LocalStorage wrapper is used to abstract from some issues related to different browsers
    var originalLocalStorage = window.localStorage;
    if (typeof originalLocalStorage === 'undefined') {
        originalLocalStorage = {
            getItem: function () { },
            setItem: function () { },
            removeItem: function () { }
        };
        alert('Local storage is not supported on this browser. Some features will not work.');
    }
    var isIE11 = SJ.isIE() === 11;
    var lastStorageEventKey;
    var lastStorageEventValue;
    var observableOnlyExternal = new SJ.utils.Observable();
    //observable is used only for events from other windows
    var observableAll;
    //observableAll is used for events from other windows and from this window too
    var thisWindowEventsBug = (SJ.isIE() === 10) || (SJ.isIE() === 9);
    /*IE9 and IE10 both incorrectly fire the storage event in ALL windows/tabs,
    https://connect.microsoft.com/IE/feedback/details/774798/localstorage-event-fired-in-source-window
     */
    if (!thisWindowEventsBug) {
        //if browser works according localStorage specification, this window events will be fired from this localStorage wrapper
        observableAll = new SJ.utils.Observable();
    };


    var onStorage = isIE11 ?
        function (event) {
            event = event || window.event;
            // Workaround for IE11 (value from storage is not actual in event handler)
            lastStorageEventKey = event.key;
            lastStorageEventValue = event.newValue;
            observableOnlyExternal.fire('storage', event);
            observableAll.fire('storage', event);
        } : thisWindowEventsBug ?
        function (event) {
            event = event || window.event;
            observableOnlyExternal.fire('storage', event);
        } : 
        function (event) {
            event = event || window.event;
            observableOnlyExternal.fire('storage', event);
            observableAll.fire('storage', event);
        };

    if (window.addEventListener) {
        var wnd = isIE11 ? window.top : window; // Workaround for IE11 (for iframes)
        wnd.addEventListener('storage', onStorage, false);
        if (wnd != window) {
            window.addEventListener('unload', function () {
                wnd.removeEventListener('storage', onStorage, false);
            });
        }
    } else if (window.attachEvent) {
        document.attachEvent('onstorage', onStorage);
    }
    scope.localStorage = {
        onChanged: function (fn, scope, listenThisWindow) {
            /*If listenThisWindow is true then event handler will be called for events fired from this window and from other.
            Otherwise it will be called only for events from other windows
            If browser has an event bug (storage recieved events from this window), then listenThisWindow is ignored, because this behaviour uncontrollable in buggy browser*/
            if (listenThisWindow && !thisWindowEventsBug) {
                observableAll.on('storage', fn, scope);
            } else {
                observableOnlyExternal.on('storage', fn, scope);
            }
        },

        onceChanged: function (fn, scope, listenThisWindow) {
            if (listenThisWindow && !thisWindowEventsBug) {
                observableAll.once('storage', fn, scope);
            } else {
                observableOnlyExternal.once('storage', fn, scope);
            }
        },

        unChanged: function (fn, scope) {
            observableOnlyExternal.un('storage', fn, scope);
            if (!thisWindowEventsBug) {
                observableAll.un('storage', fn, scope);
            }
        },

        getItem: function (key) {
            if (isIE11 && (lastStorageEventKey === key)) {
                return lastStorageEventValue;
            }
            return originalLocalStorage.getItem(key);
        },
        setItem: thisWindowEventsBug ? function (key, value) {
            if (isIE11 && (lastStorageEventKey === key)) {
                lastStorageEventValue = value;
            }
            originalLocalStorage.setItem(key, value);
        } : function (key, value) {
            var oldValue = this.getItem(key);
            if (isIE11 && (lastStorageEventKey === key)) {
                lastStorageEventValue = value;
            }
            originalLocalStorage.setItem(key, value);
            var event = {
                key: key,
                oldValue: oldValue,
                newValue: value,
                url: window.location.href.toString()
            };
            observableAll.fire('storage', event);
        },
        removeItem: thisWindowEventsBug ? function (key) {
            if (isIE11 && (lastStorageEventKey === key)) {
                lastStorageEventValue = null;
            }
            originalLocalStorage.removeItem(key);
        } : function (key) {
            var oldValue = this.getItem(key);
            if (isIE11 && (lastStorageEventKey === key)) {
                lastStorageEventValue = null;
            }
            originalLocalStorage.removeItem(key);
            var event = {
                key: key,
                oldValue: oldValue,
                newValue: null,
                url: window.location.href.toString()
            };
            observableAll.fire('storage', event);
        },

        forEach: isIE11 ? function (fn) {
            for (var i = 0; i < originalLocalStorage.length; i++) {
                var itemKey = originalLocalStorage.key(i);
                var itemValue;
                if (itemKey === lastStorageEventKey) {
                    itemValue = lastStorageEventValue;
                } else {
                    itemValue = originalLocalStorage.getItem(itemKey);
                }
                if (fn(itemKey, itemValue) === false) {
                    break;
                }
            }
        } : function (fn) {
            for (var i = 0; i < originalLocalStorage.length; i++) {
                var itemKey = originalLocalStorage.key(i);
                var itemValue = originalLocalStorage.getItem(itemKey);
                if (fn(itemKey, itemValue) === false) {
                    break;
                }
            }
        },

        setVersion: function (storagePrefix, version) {
            var me = this;
            var currentVersion = me.getItem(storagePrefix);
            if (currentVersion !== version) {
                var itemsToRemove = [];
                me.forEach(function (key) {
                    if (key.substr(0, storagePrefix.length) === storagePrefix) {
                        itemsToRemove.push(key);
                    }
                });
                itemsToRemove.forEach(function (key) {
                    me.removeItem(key);
                });
                me.setItem(storagePrefix, version);
            }
        }
    };
})(SJ);
///#source 1 1 /src/iwc/iwc.js
//https://github.com/slimjack/IWC
(function (scope) {
    var localStoragePerfix = 'IWC_' + SJ.appName;
    scope.getLocalStoragePrefix = function () {
        return localStoragePerfix;
    };
    scope.$version = '0.1.3';
    SJ.localStorage.setVersion(localStoragePerfix, scope.$version);
})(SJ.ns('iwc'));
///#source 1 1 /src/iwc/InterlockedCall.js
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
///#source 1 1 /src/iwc/SharedData.js
//https://github.com/slimjack/IWC
(function (scope) {

    var SharedData = function (dataId) {
        var me = this;
        me._dataId = dataId;
        me._observable = new SJ.utils.Observable();
        me._serializedData = SJ.localStorage.getItem(me._dataId);
        SJ.localStorage.onChanged(me.onStorageChanged, me, true);
    };

    SharedData.prototype = {
        constructor: SharedData,

        get: function () {
            var me = this;
            me._serializedData = SJ.localStorage.getItem(me._dataId);
            var data = null;
            if (me._serializedData) {
                data = JSON.parse(me._serializedData);
            }
            return data;
        },

        set: function (value, callback) {
            var me = this;
            SJ.iwc.Lock.interlockedCall(me._dataId, function () {
                me.writeToStorage(value);
                SJ.callback(callback);
            });
        },

        change: function (delegate) {
            var me = this;
            SJ.iwc.Lock.interlockedCall(me._dataId, function () {
                var data = me.get();
                data = delegate(data);
                me.writeToStorage(data);
            });
        },

        onChanged: function (fn, scope) {
            var me = this;
            me._observable.on('changed', fn, scope);
        },

        onceChanged: function (fn, scope) {
            var me = this;
            me._observable.once('changed', fn, scope);
        },

        unsubscribe: function (fn, scope) {
            var me = this;
            me._observable.un('changed', fn, scope);
        },

        //region Private
        writeToStorage: function (data) {
            var me = this;
            var serializedData = data !== null ? JSON.stringify(data) : '';
            SJ.localStorage.setItem(me._dataId, serializedData);
        },

        onStorageChanged: function (event) {
            var me = this;
            if (!event.key || (event.key === me._dataId)) {
                var serializedData = SJ.localStorage.getItem(me._dataId);
                if (serializedData !== me._serializedData) {
                    me._serializedData = serializedData;
                    var data = null;
                    if (serializedData) {
                        data = JSON.parse(serializedData);
                    }
                    me._observable.fire('changed', data);
                }
            }
        }
        //endregion
    };
    scope.SharedData = SharedData;
})(SJ.ns('iwc'));
///#source 1 1 /src/iwc/EventBus.js
//https://github.com/slimjack/IWC
(function (scope) {
    var busNodeId = SJ.generateGUID();
    var observableOnlyExternal = new SJ.utils.Observable();
    var observableAll = new SJ.utils.Observable();//for subscribers which listen for all events including genereted from this window
    var storageId = SJ.iwc.getLocalStoragePrefix() + '_EBUS';

    function onStorageChanged (event) {
        if ((event.key === storageId) && event.newValue) {
            var busEvent = JSON.parse(event.newValue);
            if (busEvent.senderBusNodeId !== busNodeId) {
                observableOnlyExternal.fire.apply(window, busEvent.args);
                observableAll.fire.apply(window, busEvent.args);
            }
        }
    };

    function fire () {
        var busEvent = {
            senderBusNodeId: busNodeId,
            args: Array.prototype.slice.call(arguments, 0)
        };
        var serializedBusEvent = JSON.stringify(busEvent);
        SJ.localStorage.setItem(storageId, serializedBusEvent);
        observableAll.fire.apply(window, busEvent.args);
    };

    SJ.localStorage.onChanged(onStorageChanged);
    SJ.copy(scope, {
        on: function (eventName, fn, scope, listenThisWindow) {
            if (listenThisWindow) {
                observableAll.on(eventName, fn, scope);
            } else {
                observableOnlyExternal.on(eventName, fn, scope);
            }
        },

        once: function (eventName, fn, scope, listenThisWindow) {
            if (listenThisWindow) {
                observableAll.once(eventName, fn, scope);
            } else {
                observableOnlyExternal.once(eventName, fn, scope);
            }
        },

        un: function (eventName, fn, scope, listenThisWindow) {
            if (listenThisWindow) {
                observableAll.un(eventName, fn, scope);
            } else {
                observableOnlyExternal.un(eventName, fn, scope);
            }
        },

        fire: fire
    });
})(SJ.ns('iwc.EventBus'));
///#source 1 1 /src/iwc/WindowMonitor.js
//https://github.com/slimjack/IWC
(function (scope) {
    var windowRecordLifeTime = 5000;
    var obsoleteRequestTimeFrame = 2000;
    var openWindows = {};
    var obsoleteWindows = {};
    var thisWindowId = window.name || SJ.generateGUID();
    var isWindowMonitorReady = false;
    var observable = new SJ.utils.Observable();
    var storageIdPrefix = SJ.iwc.getLocalStoragePrefix() + '_WND_';

    var windowRecordUpdatingPeriod = windowRecordLifeTime / 2;
    var storageId = storageIdPrefix + thisWindowId;

    SJ.windowOn('unload', onWindowUnload);
    SJ.localStorage.onChanged(onStorageChanged);
    SJ.iwc.EventBus.on('windowfocusrequest', onWindowFocusRequest);
    SJ.iwc.EventBus.on('windowisaliverequest', onWindowIsAliveRequest);
    SJ.iwc.EventBus.on('windowisaliveresponce', onWindowIsAliveResponce);

    updateDataInStorage();
    window.setInterval(updateDataInStorage, windowRecordUpdatingPeriod);

    function onWindowUnload() {
        SJ.localStorage.removeItem(storageId);
    };

    function onWindowIsAliveRequest(windowId) {
        if (windowId === thisWindowId) {
            updateDataInStorage();
            SJ.iwc.EventBus.fire('windowisaliveresponce', windowId);
        }
    };

    function onWindowIsAliveResponce(windowId) {
        if ((windowId !== thisWindowId) && obsoleteWindows[windowId]) {
            delete obsoleteWindows[windowId];
        }
    };

    function onStorageChanged(event) {
        if (event.key) {
            if (event.key.substr(0, storageIdPrefix.length) === storageIdPrefix) {//check that event is related to WindowsManager
                updateDataFromStorage();
            }
        } else {
            updateDataFromStorage();//For IE8. IE8 doesn't provide any details about storage changes
        }
    };

    function getOpenWindows() {
        var windows = {};
        SJ.localStorage.forEach(function (itemKey, itemValue) {
            if (itemValue && (itemKey.substr(0, storageIdPrefix.length) === storageIdPrefix)) {
                var windowId = itemKey.substr(storageIdPrefix.length);
                windows[windowId] = parseInt(itemValue);
            }
        });
        removeObsoleteRecords(windows);
        return windows;
    };

    function updateDataInStorage() {
        updateDataFromStorage();
        var now = (new Date()).getTime();
        openWindows[thisWindowId] = now;
        SJ.localStorage.setItem(storageId, now);
        if (!isWindowMonitorReady) {
            isWindowMonitorReady = true;
            observable.fire('windowsmanagerready');
        }
    };

    function removeObsoleteRecords(windows) {
        var now = (new Date()).getTime();
        for (var windowId in windows) {
            if (windows.hasOwnProperty(windowId) && windowId !== thisWindowId) {
                var recordAge = now - windows[windowId];
                if ((recordAge > 2 * windowRecordLifeTime)
                    || ((recordAge > windowRecordLifeTime) && obsoleteWindows[windowId] && (now - obsoleteWindows[windowId] > obsoleteRequestTimeFrame))) {
                    delete windows[windowId];
                    SJ.localStorage.removeItem(storageIdPrefix + windowId);
                } else if (recordAge > windowRecordLifeTime) {
                    if (!obsoleteWindows[windowId]) {
                        obsoleteWindows[windowId] = now;
                        SJ.iwc.EventBus.fire('windowisaliverequest', windowId);
                    }
                } else if (obsoleteWindows[windowId]) {
                    delete obsoleteWindows[windowId];
                }
            }
        }
        for (var windowId in obsoleteWindows) {
            if (obsoleteWindows.hasOwnProperty(windowId) && !windows.hasOwnProperty(windowId)) {
                delete obsoleteWindows[windowId];
            }
        }
    };

    function isWindowOpen(windowId) {
        return !!openWindows[windowId];
    };

    function updateDataFromStorage() {
        var newOpenWindows = getOpenWindows();
        var newWindows = [];
        for (var windowId in newOpenWindows) {
            if (newOpenWindows.hasOwnProperty(windowId) && !openWindows[windowId]) {
                newWindows.push(windowId);
            }
        }
        var closedWindows = [];
        for (var windowId in openWindows) {
            if (openWindows.hasOwnProperty(windowId) && !newOpenWindows[windowId]) {
                closedWindows.push(windowId);
            }
        }
        if (newWindows.length || closedWindows.length) {
            onWindowsChanged(newWindows, closedWindows);
        }
        openWindows = newOpenWindows;
    };

    function onWindowsChanged(newWindows, closedWindows) {
        observable.fire('windowschanged', newWindows, closedWindows);
    };

    function onWindowFocusRequest (windowId) {
        if (windowId === thisWindowId) {
            window.focus();
            blinkTitle();
        }
    };

    var blinkCounter = 0;
    function blinkTitle() {
        if (blinkCounter) {
            return;
        }

        var blinkPeriod = 500;//ms
        var numOfBlinks = 3;
        var title = document.title;
        var isTitleVisible = false;
        blinkCounter = numOfBlinks * 2;

        var changeTitle = function () {
            if (isTitleVisible) {
                document.title = title;
            } else {
                document.title = "******";
            }
            isTitleVisible = !isTitleVisible;
            blinkCounter--;
            if (blinkCounter) {
                window.setTimeout(changeTitle, blinkPeriod);
            }
        };
        window.setTimeout(changeTitle, blinkPeriod);
    };

    SJ.copy(scope, {
        isWindowOpen: isWindowOpen,

        getOpenWindowIds: function () {
            var result = [];
            for (var windowId in openWindows) {
                if (openWindows.hasOwnProperty(windowId)) {
                    result.push(windowId);
                }
            }
            return result;
        },

        setFocus: function (windowId) {
            if (windowId) {
                onWindowFocusRequest(thisWindowId);
            } else {
                SJ.iwc.EventBus.fire('windowfocusrequest', windowId);
            }
        },

        getThisWindowId: function () {
            return thisWindowId;
        },

        isReady: function () {
            return isWindowMonitorReady;
        },

        onReady: function (fn, scope) {
            if (isWindowMonitorReady) {
                fn.call(scope);
            } else {
                observable.once('windowsmanagerready', fn, scope);
            }
        },

        onWindowsChanged: function (fn, scope) {
            observable.on('windowschanged', fn, scope);
        },

        onceWindowsChanged: function (fn, scope) {
            observable.once('windowschanged', fn, scope);
        },

        unsubscribe: function (fn, scope) {
            observable.un('windowschanged', fn, scope);
        }
    });
})(SJ.ns('iwc.WindowMonitor'));

///#source 1 1 /src/iwc/Lock.js
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

    SJ.windowOn(window, 'unload', onWindowUnload);
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
        var itemsToRemove = [];
        SJ.iwc.WindowMonitor.onReady(function () {
            SJ.localStorage.forEach(function (itemKey, itemValue) {
                if (itemValue && (itemKey.substr(0, lockIdPrefix.length) === lockIdPrefix)) {
                    var lockInfo = JSON.parse(itemValue);
                    if (!lockInfo || !lockInfo.timestamp || !lockInfo.ownerWindowId) {//junk lock info
                        itemsToRemove.push(itemKey);
                        return;
                    }
                    var lockBelongsToThisWindow = lockInfo.ownerWindowId === SJ.iwc.WindowMonitor.getThisWindowId();
                    var lockBelongsToClosedWindow = !SJ.iwc.WindowMonitor.isWindowOpen(lockInfo.ownerWindowId);
                    var lockId = itemKey.substr(lockIdPrefix.length);
                    if (lockBelongsToClosedWindow || (lockBelongsToThisWindow && (findLock(lockId) === -1))) {//junk lock
                        itemsToRemove.push(itemKey);
                    }
                }
            });
            if (itemsToRemove.length) {
                for (var i = 0; i < itemsToRemove.length; i++) {
                    SJ.localStorage.removeItem(itemsToRemove[i]);
                }
                fire();
            }
            if (callback) {
                callback();
            }
        });
    };

    function releaseAllLocks() {
        var activeLocks = [].concat(activeLocks);
        for (var i = 0; i < activeLocks.length; i++) {
            activeLocks[i].release();
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
///#source 1 1 /src/iwc/Client.js
//https://github.com/slimjack/IWC
(function (scope) {
    var Client = function(serverId, readyCallback) {
        var me = this;
        me._serverId = serverId;
        me._isReady = false;
        me._observable = SJ.utils.Observable.decorate(me, true);
        me._serverDescriptionHolder = new SJ.iwc.SharedData(serverId);
        var serverDescription = me._serverDescriptionHolder.get();
        if (serverDescription) {
            me.updateContract(serverDescription);
        }
        me._serverDescriptionHolder.onChanged(function (newServerDescription) {
            me.updateContract(newServerDescription);
        });
        if (readyCallback) {
            me.onReady(readyCallback);
        }
    };

    Client.prototype = {
        constructor: Client,

        onReady: function(fn, scope) {
            var me = this;
            if (me._isReady) {
                fn.call(scope);
            } else {
                me._observable.once('ready', fn, scope);
            }
        },

        //region Private
        updateContract: function(serverDescription) {
            var me = this;
            var serverMethods = serverDescription;
            serverMethods.forEach(function(methodName) {
                if (!me[methodName]) {
                    me[methodName] = me.createProxyMethod(methodName);
                }
            });
            if (!me._isReady) {
                me._isReady = true;
                me._observable.fire('ready');
            }
        },

        createProxyMethod: function(methodName) {
            var me = this;

            return function() {
                var callId = null;
                var callback = null;
                var args = Array.prototype.slice.call(arguments, 0);
                if (args.length && SJ.isFunction(args[args.length - 1])) {
                    callId = SJ.generateGUID();
                    callback = args.pop();
                }
                var eventData = {
                    methodName: methodName,
                    callId: callId,
                    args: args
                };
                SJ.iwc.EventBus.fire('servercall_' + me._serverId, eventData);
                if (callId) {
                    SJ.iwc.EventBus.once('servercallback_' + callId, callback);
                }
            };
        }
        //endregion
    };
    scope.Client = Client;
})(SJ.ns('iwc'));

///#source 1 1 /src/iwc/Server.js
//https://github.com/slimjack/IWC
(function (scope) {
    var Server = function(serverId, config) {
        var me = this;
        me._serverId = serverId;
        me._serverDescriptionHolder = new SJ.iwc.SharedData(me._serverId);
        SJ.copy(me, config.exposed);
        var exposedConfig = config.exposed;
        delete config.exposed;
        SJ.copy(me, config);
        SJ.lock(serverId, function () {
            me.onInit();
            me.updateServerDescription(exposedConfig);
            SJ.iwc.EventBus.on('servercall_' + me._serverId, me.onServerCall, me);
        });
    };

    Server.prototype = {
        constructor: Server,

        onInit: SJ.emptyFn,

        //region Private
        updateServerDescription: function (exposedConfig) {
            var me = this;
            var serverMethods = [];
            SJ.Object.each(exposedConfig, function (methodName) {
                serverMethods.push(methodName);
            });
            me._serverDescriptionHolder.set(serverMethods);
        },

        onServerCall: function (eventData) {
            var me = this;
            var args = eventData.args || [];
            if (eventData.callId) {
                var callback = function() {
                    var callbackArgs = Array.prototype.slice.call(arguments, 0);
                    callbackArgs.unshift('servercallback_' + callId);
                    SJ.iwc.EventBus.fire.apply(SJ.iwc.EventBus, callbackArgs);
                };
                args.unshift(callback);
            } else {
                //empty callback
                args.unshift(SJ.emptyFn);
            }
            me[eventData.methodName].apply(me, args);
        }
        //endregion
    };
    scope.Server = Server;
})(SJ.ns('iwc'));
