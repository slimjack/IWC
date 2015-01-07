SJ.localStorage.removeItem('interlockedCall');
var childWindow = window.open('interlockedCall-test-child.html', 'interlockedCall-test-child');

describe("Lock.", function () {
    beforeEach(function (done) { done(); });
    it('Lock.interlockedCall() should provide mutual lock for specified Id', function (done) {
        SJ.localStorage.onChanged(function (event) {
            if ((event.key && event.key === 'interlockedCall') || (!event.key && SJ.localStorage.getItem('interlockedCall'))) {
                var lockedByChild = true;
                SJ.iwc.Lock.interlockedCall('interlockedCall', function () {
                    expect(lockedByChild).toBe(false);
                    done();
                });
                setTimeout(function () {
                    expect(lockedByChild).toBe(true);
                    lockedByChild = false;
                }, 1000);
            }
        });
    });
});

SJ.windowOn('unload', function() {
    childWindow.close();
});