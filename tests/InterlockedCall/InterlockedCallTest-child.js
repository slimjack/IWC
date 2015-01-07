var startTime = new Date().getTime();
SJ.iwc.Lock.interlockedCall('interlockedCall', function () {
    var i = 0;
    while ((new Date().getTime() - startTime) < 2000) {
        i++;
    }
});
SJ.localStorage.setItem('interlockedCall', true);
