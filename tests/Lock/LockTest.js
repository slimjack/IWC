var numOfChildWindows = 5;
var childWindows = [];
for (var i = 0; i < numOfChildWindows; i++) {
    var windowName = 'Lock-test-child' + i;
    childWindows.push(window.open('Lock-test-child.html', windowName));
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 500000;
describe("Lock.", function () {
    beforeEach(function (done) {
        done();
    });
    it('Lock.capture(). Captured lock should be held only by one window until window is closed or lock is released', function (done) {
        var testFn = function () {
            var numOfCapturedLocks = 0;
            var capturedLock = null;
            childWindows.forEach(function(childWindow) {
                if (childWindow.lock) {
                    expect(childWindow.lock.isCaptured()).toEqual(childWindow.captureCallbackExecuted);
                    if (childWindow.lock.isCaptured()) {
                        capturedLock = childWindow.lock;
                        numOfCapturedLocks++;
                    }
                }
            });
            if (numOfCapturedLocks === 0) {
                setTimeout(testFn, 500);
                return;
            }
            capturedLock.release();
            setTimeout(function () {
                var numOfCapturedLocks = 0;
                var numOfReleasedLocks = 0;
                var capturedLock = null;
                childWindows.forEach(function (childWindow) {
                    expect(childWindow.lock.isCaptured() || childWindow.lock.isReleased()).toEqual(childWindow.captureCallbackExecuted);
                    if (childWindow.lock.isCaptured()) {
                        capturedLock = childWindow.lock;
                        numOfCapturedLocks++;
                    }
                    if (childWindow.lock.isReleased()) {
                        numOfReleasedLocks++;
                    }
                });
                expect(numOfCapturedLocks).toEqual(1);
                expect(numOfReleasedLocks).toEqual(1);
                SJ.iwc.Lock.capture('lockid', function () {
                    expect(childWindows.length).toEqual(0);
                    done();
                });
                setTimeout(function () {
                    childWindows.forEach(function (childWindow) {
                        childWindow.close();
                    });
                    childWindows.length = 0;
                }, 1000);
            }, 500);
        };
        testFn();
    });
});


SJ.windowOn('unload', function () {
    childWindows.forEach(function (childWindow) {
        childWindow.close();
    });
});