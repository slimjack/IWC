var captureCallbackExecuted= false;
var lock = SJ.iwc.Lock.capture('lockid', function () {
    captureCallbackExecuted = true;
});
