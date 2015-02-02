//https://github.com/slimjack/IWC
(function (scope) {
    var Server = function(serverId, serverConfig, privateConfig) {
        var me = this;
        me._serverId = serverId;
        me._serverDescriptionHolder = new SJ.iwc.SharedData(me._serverId);
        SJ.copy(me, serverConfig);
        SJ.copy(me, privateConfig);
        SJ.lock(serverId, function () {
            if (me.initServer) {
                me.initServer();
            }
            me.updateServerDescription(serverConfig);
            SJ.iwc.EventBus.on('servercall_' + me._serverId, me.onServerCall, me);
        });
    };

    Server.prototype = {
        constructor: Server,

        //region Private
        updateServerDescription: function (serverConfig) {
            var me = this;
            var serverMethods = [];
            SJ.Object.each(serverConfig, function (methodName) {
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
                args.unshift(function() {});
            }
            me[eventData.methodName].apply(me, args);
        }
        //endregion
    };
    scope.Server = Server;
})(SJ.ns('iwc'));