//https://github.com/slimjack/IWC
(function (scope) {
    var Client = function(serverId) {
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
