var InterWindowLauncher = (function () {
    var externalLaunchers = {};
    var internalLaunchers = {};
    var windows = {};

    InterWindowEventBus.On('launchersregistered', onExternalLaunchersRegistered);
    InterWindowEventBus.On('launchersremoved', onExternalLaunchersRemoved);
    InterWindowEventBus.FireBroadcastEvent('interwindowlauncherinitialized', InterWindowWindowsManager.GetThisWindowId());
    InterWindowEventBus.On('interwindowlauncherinitialized', onExternalLauncherInitialized);
    InterWindowWindowsManager.OnWindowsChanged(function(newWindows, closedWindows) {
        if (closedWindows.length) {
            onWindowsClosed(closedWindows);
        }
    });
    InterWindowEventBus.On('interwindowlaunch', onInterWindowLaunch);

    function onInterWindowLaunch(launcherId, params, additionalParams) {
        if (internalLaunchers[launcherId]) {
            internalLaunchers[launcherId].launchFn.call(internalLaunchers[launcherId].scope, params, additionalParams);
        }
    };

    function onExternalLauncherInitialized(windowId) {
        if (InterWindowWindowsManager.GetThisWindowId() !== windowId) {
            InterWindowEventBus.FireBroadcastEvent('launchersregistered', InterWindowWindowsManager.GetThisWindowId(), translateInternalToExternalLaunchers(internalLaunchers));
        }
    };

    function onExternalLaunchersRegistered(windowId, launchers) {
        if (InterWindowWindowsManager.GetThisWindowId() !== windowId) {
            registerExternalLaunchers(windowId, launchers);
        }
    };

    function onExternalLaunchersRemoved(windowId, launchers) {
        if (InterWindowWindowsManager.GetThisWindowId() !== windowId) {
            removeExternalLaunchers(windowId, launchers);
        }
    };

    function onWindowsClosed(windowIds) {
        for (var i = 0; i < windowIds.length; i++) {
            removeAllExternalLaunchers(windowIds[i]);
        }
    };

    function registerLaunchers() {
        var newLaunchers = {};
        for (var i = 0; i < arguments.length; i++) {
            var launcherId = GUIDGenerator.Generate();
            var launcher = arguments[i];
            launcher.launcherId = launcherId;
            launcher.params = launcher.params || {};
            internalLaunchers[launcherId] = launcher;
            newLaunchers[launcherId] = launcher;
        }
        InterWindowEventBus.FireBroadcastEvent('launchersregistered', InterWindowWindowsManager.GetThisWindowId(), translateInternalToExternalLaunchers(newLaunchers));
    };

    function removeLaunchers() {
        var removedLaunchers = {};
        for (var i = 0; i < arguments.length; i++) {
            var launcherId = arguments[i].launcherId;
            delete internalLaunchers[launcherId];
            removedLaunchers[launcherId] = arguments[i];
        }
        InterWindowEventBus.FireBroadcastEvent('launchersremoved', InterWindowWindowsManager.GetThisWindowId(), translateInternalToExternalLaunchers(removedLaunchers));
    };

    function registerExternalLaunchers(windowId, launchers) {
        windows[windowId] = windows[windowId] || {};
        var windowLaunchers = windows[windowId];
        for(var launcherId in launchers) {
            if (launchers.hasOwnProperty(launcherId)) {
                externalLaunchers[launcherId] = launchers[launcherId];
                windowLaunchers[launcherId] = launchers[launcherId];
            }
        }
    };

    function removeAllExternalLaunchers(windowId) {
        var windowLaunchers = windows[windowId];
        if (windowLaunchers) {
            for (var launcherId in windowLaunchers) {
                if (windowLaunchers.hasOwnProperty(launcherId)) {
                    delete externalLaunchers[launcherId];
                }
            }
            delete windows[windowId];
        }
    };

    function removeExternalLaunchers(windowId, launchersToRemove) {
        var windowLaunchers = windows[windowId];
        for (var launcherId in launchersToRemove) {
            if (launchersToRemove.hasOwnProperty(launcherId)) {
                delete externalLaunchers[launcherId];
                if (windowLaunchers) {
                    delete windowLaunchers[launcherId];
                }
            }
        }
    };

    function translateInternalToExternalLaunchers(internalLaunchers) {
        var result = {};
        for(var launcherId in internalLaunchers) {
            if (internalLaunchers.hasOwnProperty(launcherId)) {
                result[launcherId] = {
                    url: internalLaunchers[launcherId].url,
                    params: internalLaunchers[launcherId].params,
                    type: internalLaunchers[launcherId].type
                };
            }
        }
        return result;
    };

    function searchLauncher(type, params) {
        var foundLaunchers = findLaunchersByParams(internalLaunchers, type, params);
        if (foundLaunchers.length) {
            return { launcherId: foundLaunchers[0], isInternal: true };
        }
        foundLaunchers = findLaunchersByParams(externalLaunchers, type, params);
        if (foundLaunchers.length) {
            return { launcherId: foundLaunchers[0], isInternal: false };
        }
        var foundLaunchers = findLaunchersByType(internalLaunchers, type);
        if (foundLaunchers.length) {
            return { launcherId: foundLaunchers[0], isInternal: true };
        }
        foundLaunchers = findLaunchersByType(externalLaunchers, type);
        if (foundLaunchers.length) {
            return { launcherId: foundLaunchers[0], isInternal: false };
        }
        return null;
    };

    function findLaunchersByType(launchers, type) {
        var foundByType = [];
        for (var launcherId in launchers) {
            if (launchers.hasOwnProperty(launcherId)) {
                if ((launchers[launcherId].type === type) && isObjectEmpty(launchers[launcherId].params)) {
                    foundByType.push(launcherId);
                }
            }
        }
        return foundByType;
    };

    function findLaunchersByParams(launchers, type, params) {
        var foundByParams = [];
        for (var launcherId in launchers) {
            if (launchers.hasOwnProperty(launcherId)) {
                if ((launchers[launcherId].type === type) && !isObjectEmpty(launchers[launcherId].params) && paramsEqual(params, launchers[launcherId].params)) {
                    foundByParams.push(launcherId);
                }
            }
        }
        return foundByParams;
    };

    function isObjectEmpty(obj) {
        if (!obj) return true;
        for (var key in obj) if (obj.hasOwnProperty(key)) return false;
        return true;
    };

    function paramsEqual(obj1, obj2) {
        if (obj1 === obj2) return true;

        var propertiesCount1 = 0;
        for (var property in obj1) if (obj1.hasOwnProperty(property)) propertiesCount1++;
        var propertiesCount2 = 0;
        for (var property in obj2) {
            if (obj2.hasOwnProperty(property)) {
                if (obj2[property] !== obj1[property]) {
                    return false;
                }
                propertiesCount2++;
            }
        }
        return propertiesCount1 === propertiesCount2;
    };

    function launch(type, params, additionalParams) {
        var searchResult = searchLauncher(type, params);
        if (!searchResult) {
            return false;
        }
        additionalParams = additionalParams || {};
        if (searchResult.isInternal) {
            internalLaunchers[searchResult.launcherId].launchFn.call(internalLaunchers[searchResult.launcherId].scope, params, additionalParams);
        } else {
            InterWindowEventBus.FireBroadcastEvent('interwindowlaunch', searchResult.launcherId, params, additionalParams);
        }
        return true;
    };

    return {
        Launch: function (type, params, additionalParams) {
            return launch(type, params, additionalParams);
        },

        RegisterLaunchers: function () {
            registerLaunchers.apply(this, arguments);
        },

        RemoveLaunchers: function () {
            removeLaunchers.apply(this, arguments);
        }
    };
})();