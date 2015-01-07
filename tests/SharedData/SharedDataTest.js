var childWindows = [];
var numOfChildWindows = 5;
for (var i = 0; i < numOfChildWindows; i++) {
    childWindows.push(window.open('SharedData-test-child.html', 'SharedData-test-child' + i));
}
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
describe("SharedData.", function () {
    beforeEach(function (done) { done(); });
    it('Changes of SharedData in any window should be replicated in all other windows', function (done) {
        //launch test after some time to be sure that child windows loaded
        setTimeout(function() {
            var sharedData = new SJ.iwc.SharedData('testSharedData');
            sharedData.set({ field: 2 });
            setTimeout(function() {
                SJ.forEach(childWindows, function (childWindow) {
                    var valueInChild = childWindow.sharedData.get();
                    expect(valueInChild).not.toBeNull();
                    expect(valueInChild.field).toEqual(2);
                });
                sharedData.change(function(data) {
                    expect(data.field).toEqual(2);
                    data.field = 'testvalue';
                    return data;
                });
                setTimeout(function () {
                    console.log('check');
                    SJ.forEach(childWindows, function (childWindow) {
                        var valueInChild = childWindow.sharedData.get();
                        expect(valueInChild).not.toBeNull();
                        expect(valueInChild.field).toEqual('testvalue');
                    });
                    done();
                }, 500);
            }, 500);
        }, 1000);
    });
});

SJ.windowOn('unload', function () {
    SJ.forEach(childWindows, function (childWindow) {
        childWindow.close();
    });
});