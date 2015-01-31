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
    var storageId = SJ.generateGUID();
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
            if (currentVersion && (currentVersion !== version)) {
                var itemsToRemove = [];
                me.forEach(function (key) {
                    if (key.substr(0, storagePrefix.length) === storagePrefix) {
                        itemsToRemove.push(key);
                    }
                });
                itemsToRemove.forEach(function (key) {
                    me.removeItem(key);
                });
            }
            me.setItem(storagePrefix, version);
        }
    };
})(SJ);