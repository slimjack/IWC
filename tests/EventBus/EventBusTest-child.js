var data = {
    onCounter: 0,
    testValue: null
};
SJ.iwc.EventBus.on('testEvent', function (value) {
    data.onCounter++;
    data.testValue = value;
});