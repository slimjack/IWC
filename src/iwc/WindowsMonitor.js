(function (scope) {
    var windowRecordLifeTime = 20000;
    var obsoleteRequestTimeFrame = 3000;
    var openWindows = {};
    var obsoleteWindows = {};
    var thisWindowId = window.name || SJ.generateGUID();
    var isWindowsMonitorReady = false;
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
            updateDataFromStorage();//For IE8 and IE9. IE8 and IE9 don't provide any details about storage changes
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
        vars.openWindows[thisWindowId] = now;
        SJ.localStorage.setItem(storageId, now);
        if (!isWindowsMonitorReady) {
            isWindowsMonitorReady = true;
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

    function isWindowOpened(windowId) {
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
        var removedWindows = [];
        for (var windowId in vars.openWindows) {
            if (openWindows.hasOwnProperty(windowId) && !newOpenWindows[windowId]) {
                removedWindows.push(windowId);
            }
        }
        if (newWindows.length || removedWindows.length) {
            onWindowsChanged(newWindows, removedWindows);
        }
        openWindows = newOpenWindows;
    };

    function onWindowsChanged(newWindows, removedWindows) {
        observable.fire('windowschanged', newWindows, removedWindows);
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
        isWindowOpen: isWindowOpened,

        setFocus: function (windowId) {
            SJ.iwc.EventBus.fire('windowfocusrequest', windowId);
        },

        setThisFocus: function () {
            onWindowFocusRequest(thisWindowId);
        },

        getThisWindowId: function () {
            return thisWindowId;
        },

        isReady: function () {
            return isWindowsMonitorReady;
        },

        onReady: function (fn, scope) {
            if (isWindowsMonitorReady) {
                fn.call(scope);
            } else {
                observable.once('windowsmanagerready', fn, scope);
            }
        },

        onWindowsChanged: function (fn, scope) {
            observable.on('windowschanged', fn, scope);
        },

        unsubscribe: function (fn, scope) {
            observable.un('windowschanged', fn, scope);
        }
    });
})(SJ.ns('iwc.WindowsMonitor'));
