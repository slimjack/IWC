//https://github.com/slimjack/IWC
(function (scope) {
    var fixedHandlers = {};
    var handlerId = 0;
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
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
        },

        copy: function (dst, src) {
            var i;
            for (i in src) {
                dst[i] = src[i];
            }

            return dst;
        },

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
