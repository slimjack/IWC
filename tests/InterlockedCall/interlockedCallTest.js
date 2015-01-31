var numOfChildWindows = 5;
var childWindows = [];
for (var i = 0; i < numOfChildWindows; i++) {
    var windowName = 'interlockedCall-test-child' + i;
    childWindows.push(window.open('interlockedCall-test-child.html', windowName));
}
var childWindow = null;
var onChildWindowLoad = function (fn) {
    if (childWindows[0].addEventListener) {
        childWindows[0].addEventListener('load', fn, true);
    } else if (childWindows[0].attachEvent) {
        childWindows[0].attachEvent('onload', fn);
    }
};
SJ.iwc.Lock.testingMode = true;
SJ.iwc.Lock.lockTimeout = 10000;
jasmine.DEFAULT_TIMEOUT_INTERVAL = numOfChildWindows * SJ.iwc.Lock.lockTimeout + 20000;

describe("Lock.", function () {
    beforeEach(function (done) { done(); });
    it('Lock.interlockedCall() should provide mutual lock for specified Id', function (done) {
        var getNumOfPerformedChildInterlockedCall = function() {
            var numOfInterlockedCalls = 0;
            childWindows.forEach(function (childWindow) {
                if (childWindow.captureInterlockedCallPerformed) {
                    numOfInterlockedCalls++;
                }
            });
            return numOfInterlockedCalls;
        }
        var testFn = function() {
            if (getNumOfPerformedChildInterlockedCall() > 0) {
                var startTimeStamp = new Date().getTime();
                console.log(startTimeStamp);
                SJ.iwc.Lock.interlockedCall('interlockedCall', function () {
                    var now = new Date().getTime();
                    expect(now - startTimeStamp).toBeGreaterThan(5000);
                    console.log("lock time " + (now - startTimeStamp));
                    done();
                });
            } else {
                setTimeout(testFn, 500);
            }
        };
        testFn();
    });
});

SJ.windowOn('unload', function () {
    childWindows.forEach(function (childWindow) {
        childWindow.close();
    });
});