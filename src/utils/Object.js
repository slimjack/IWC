//https://github.com/slimjack/IWC
(function (scope) {
    var ObjectHelper = {
        each: function (obj, fn) {
            for (var propName in obj) {
                if (obj.hasOwnProperty(propName)) {
                    if (fn(obj[propName], propName) === false) {
                        break;
                    }
                }
            }
        }
    };
    SJ.copy(scope, ObjectHelper);
})(SJ.ns('Object'));
