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
            var data;
            if (me._serializedData) {
                data = JSON.parse(me._serializedData);
            }
            return data || {};
        },

        set: function (value) {
            var me = this;
            SJ.iwc.Lock.interlockedCall(me._dataId, function () {
                me.writeToStorage(value);
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
            me._serializedData = data !== null ? JSON.stringify(data) : '';
            SJ.localStorage.setItem(me._dataId, me._serializedData);
            me._observable.fire('changed', data);
        },

        onStorageChanged: function (event) {
            var me = this;
            if ((event.key && event.key === me._dataId) || event.key) {
                var serializedData = SJ.localStorage.getItem(me._dataId);
                if (serializedData !== me._serializedData) {
                    me._observable.fire('changed', data);
                }
            }
        }
        //endregion
    };
    scope.SharedData = SharedData;
})(SJ.ns('iwc'));