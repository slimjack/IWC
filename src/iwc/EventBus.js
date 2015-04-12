//https://github.com/slimjack/IWC
(function (scope) {
    var busNodeId = SJ.generateGUID();
    var observableOnlyExternal = new SJ.utils.Observable();
    var observableAll = new SJ.utils.Observable();//for subscribers which listen for all events including genereted from this window
    var storageId = SJ.iwc.getLocalStoragePrefix() + '_EBUS';
    var onStorageChanged;
    var fire;

    if (SJ.localStorage.isFullStorageEventSupported()) {
        onStorageChanged = function(event) {
            if ((event.key === storageId) && event.newValue) {
                var busEvent = JSON.parse(event.newValue);
                if (busEvent.senderBusNodeId !== busNodeId) {
                    observableOnlyExternal.fire.apply(window, busEvent.args);
                    observableAll.fire.apply(window, busEvent.args);
                }
            }
        };

        fire = function() {
            var busEvent = {
                senderBusNodeId: busNodeId,
                args: Array.prototype.slice.call(arguments, 0)
            };
            var serializedBusEvent = JSON.stringify(busEvent);
            SJ.localStorage.setItem(storageId, serializedBusEvent);
            observableAll.fire.apply(window, busEvent.args);
        };
    } else {
        var eventIdDelimiter = '#';
        var lastEventId;
        onStorageChanged = function (event) {
            var serializedBusEvent = SJ.localStorage.getItem(storageId);
            var eventId = serializedBusEvent.substr(0, serializedBusEvent.indexOf(eventIdDelimiter));
            if (lastEventId !== eventId) {
                lastEventId = eventId;
                var eventData = serializedBusEvent.substr(eventId.length + 1);
                var busEvent = JSON.parse(eventData);
                if (busEvent.senderBusNodeId !== busNodeId) {
                    observableOnlyExternal.fire.apply(window, busEvent.args);
                    observableAll.fire.apply(window, busEvent.args);
                }
            }
        };

        fire = function () {
            var busEvent = {
                senderBusNodeId: busNodeId,
                args: Array.prototype.slice.call(arguments, 0)
            };
            var eventId = SJ.generateGUID();
            var serializedBusEvent = eventId + eventIdDelimiter  + JSON.stringify(busEvent);
            SJ.localStorage.setItem(storageId, serializedBusEvent);
            observableAll.fire.apply(window, busEvent.args);
        };
    }

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