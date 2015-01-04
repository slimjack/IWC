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
                    if (eventListeners[i].listenerFn === listenerFn && eventListeners[i].scope === scope) {
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
