var childWindows = [];
var numOfChanges = 10000;
var numOfChildWindows = 5;
for(var i = 0; i < numOfChildWindows; i++){
    childWindows.push(window.open('localStorage-test-child.html', 'localStorage-test-child' + i));
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
describe("LocalStorage.", function () {
    beforeEach(function (done) {
        done();
    });
    var i = 0;
    var changesPerInterval = 100;
    var fillFunc = function () {
        for (var j = 0; j < changesPerInterval; j++) {
            SJ.localStorage.setItem('test', i);
            i++;
        }
        if (i < numOfChanges) {
            setTimeout(fillFunc, 10);
        }
    };
    setTimeout(fillFunc, 1000);
    it('Event propagation stability. Num of storage changes: ' + numOfChanges, function (done) {
        setTimeout(function () {
            childWindows.forEach(function (childWindow) {
                expect(childWindow.data.onStorageCounter).toEqual(i);
            });
            done();
        }, 20000);
    });
    it('Data propagation stability. Num of storage changes: ' + numOfChanges, function (done) {
        childWindows.forEach(function (childWindow) {
            expect(childWindow.data.testValue).toEqual((i - 1).toString());
            expect(childWindow.SJ.localStorage.getItem('test')).toEqual((i - 1).toString());
            expect(SJ.localStorage.getItem('test')).toEqual((i - 1).toString());
        });
        done();
    });
});


SJ.windowOn('unload', function () {
    childWindows.forEach(function (childWindow) {
        childWindow.close();
    });
});