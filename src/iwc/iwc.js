(function (scope) {
    var localStoragePerfix = 'IWC_' + SJ.appName;
    scope.getLocalStoragePrefix = function () {
        return localStoragePerfix;
    };
    scope.$version = '0.1';
    SJ.localStorage.setVersion(localStoragePerfix, scope.$version);
})(SJ.ns('iwc'));