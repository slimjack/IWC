(function (scope) {
    var busNodeId = SJ.generateGUID();
    var observableOnlyExternal = new SJ.utils.Observable();
    var observableAll = new SJ.utils.Observable();//for subscribers which listen for all events including genereted from this window
    var storageId = SJ.iwc.getLocalStoragePrefix() + '_EVENTBUS';
    SJ.localStorage.onChanged(onStorageChanged);

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

    scope = {
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
    };
})(SJ.ns('iwc.EventBus'));