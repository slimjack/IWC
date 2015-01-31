var numOfChildWindows = 5;
var childWindows = [];
var numOfOpenedWindows = 0;
SJ.iwc.WindowMonitor.onWindowsChanged(function (newWindows, closedWindows) {
    numOfOpenedWindows += newWindows.length - closedWindows.length;
});
for (var i = 0; i < numOfChildWindows; i++) {
    var windowName = 'WindowMonitor-test-child' + i;
    if (SJ.iwc.WindowMonitor.isWindowOpen(windowName)) {
        numOfOpenedWindows++;
    }
    childWindows.push(window.open('WindowMonitor-test-child.html', windowName));
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
describe("WindowMonitor.", function () {
    beforeEach(function (done) {
        done();
    });
    it('WindowMonitor should provide actual information about open windows', function (done) {
        setTimeout(function() {
            expect(numOfOpenedWindows).toEqual(childWindows.length);
            childWindows.forEach(function (childWindow) {
                expect(SJ.iwc.WindowMonitor.isWindowOpen(childWindow.name)).toBe(true);
            });
            childWindows.shift().close();
            childWindows.shift().close();
            setTimeout(function () {
                expect(numOfOpenedWindows).toEqual(childWindows.length);
                childWindows.forEach(function (childWindow) {
                    expect(SJ.iwc.WindowMonitor.isWindowOpen(childWindow.name)).toBe(true);
                });
                done();
            }, 2000);
        }, 2000);
    });
});

SJ.windowOn('unload', function () {
    childWindows.forEach(function (childWindow) {
        childWindow.close();
    });
});