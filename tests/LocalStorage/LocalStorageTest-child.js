var data = {
    onStorageCounter: 0,
    testValue: null
};
SJ.localStorage.onChanged(function (event) {
    if (event.key) {
        if (event.key === 'test') {
            data.onStorageCounter++;
            data.testValue = event.newValue;
        }
    } else {
        var value = SJ.localStorage.getItem('test');
        if (value !== data.testValue) {
            data.onStorageCounter++;
            data.testValue = value;
        }
    }
});