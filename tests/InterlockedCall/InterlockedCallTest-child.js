var captureInterlockedCallPerformed = false;
SJ.windowOn('load', function () {
    SJ.iwc.Lock.testingMode = true;
    SJ.iwc.Lock.lockTimeout = 10000;
    SJ.iwc.Lock.interlockedCall('interlockedCall', function () {
        var now = new Date().getTime();
        document.getElementsByTagName('body')[0].innerHTML += 'lock-' + now;
        captureInterlockedCallPerformed = true;
    });
});