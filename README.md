![](/icon.png) IWC
===

Inter-window (cross-tab) communication library.

This library provides functionality for data exchange and synchronization between browser windows (tabs). It is based on localStorage. All features are designed to cover situations when window (tab) crashes. 
#Features:
- **Interlocked call** guarantees that function is executed only in one window at the same time
- **Lock** guarantees that only one window holds the lock. Lock can be captured by another window only if holder window is closed or lock is released
- **Event bus** allows to distribute events among windows
- **WindowMonitor** tracks windows (tabs) and notifies about window closing/opening
- **Shared data** provides thread-safe access (read-modify-write operation) to data shared between windows.

Library doesn't use localStorage directly - it is accessed via wrapper **SJ.localStorage**. This wrapper is intended to encapsulate some browser specific issues.

#Supported browsers
**IWC** doesn't support IE8 and IE9, but it is planed to add IE9 support. Library was tested on IE10, IE11, Chrome (39.0.2171.95 m) and Firefox(34.0.5) 

#API

###interlockedCall
`SJ.iwc.Lock.interlockedCall({string}lockId, fn)`
####Aliases:
- `SJ.interlockedCall`

####Parameters:
- `lockId` - the id which is used to identify interlocked calls.
- `fn` - function to execute exclusively.

####Description:
`interlockedCall` guarantees that interlocked calls from other windows with the same lockId will not be executed simultaniously. Function is executed asynchronously.

**Limitation: exclusive execution is guaranteed only during 3 seconds.**

####Example:
If you need to perform some operations with local storage as one atomic operation, use interlocked call:
```js
SJ.interlockedCall('myLockId', function () {
    var value = SJ.localStorage.getItem('myStorageKey');
    value += 'something';
    SJ.localStorage.getItem('myStorageKey', value);
});
```
Storage item 'myStorageKey' will not be changed between getItem and setItem.

###lock
`{object}SJ.iwc.Lock.capture({string}lockId, callback)`
####Aliases:
- `SJ.lock`

####Parameters:
- `lockId` - the id which is used to identify the same lock in different windows.
- `callback` - function which will be executed when lock is captured.

####Return value:
Returns lock object which allows to release lock and track its state. Lock object methods:
    - `isCaptured()` - returns true if lock is captured.
    - `isReleased()` - returns true if lock is released.
    - `release()` - releases captured lock or cancels lock request.

####Description:
`lock` guarantees that only one window holds the lock. Lock can be captured by another window only if holder window is closed or lock is released.

####Example:
If you need to set lock for unlimited time, use locks. If window captures lock, it is guaranteed that other windows will not get this lock (with the same Id) until it is released or holder window is closed.
```js
var lock = SJ.lock('myLockId', function () {
    console.log('myLockId lock is captured');
    console.log(lock.isCaptured());//true
    console.log(lock.isReleased());//false
    doSomething();
});
console.log(lock.isReleased());//false

function doSomething() {
    //do something (synchronously or asynchronously)
    lock.release();
    console.log(lock.isCaptured());//false
    console.log(lock.isReleased());//true
};
```

##EventBus (SJ.iwc.EventBus)
Provides an API to broadcast events between windows (tabs). Event bus methods:

- `on` - event subscription.
- `once` - subscription on a single event.
- `un` - event unsubscription.
- `fire` - event sending

###Subscription
`SJ.iwc.EventBus.on({string}eventName, handlerFn, [scope], [{bool}listenThisWindow])`

####Parameters:
- `eventName` - name of the event to which subscribe to.
- `handlerFn` - function which is called when event is raised. All parameters specified for event are passed to `handlerFn` as parameters.
- `scope(optional)` - is used to set the scope of `handlerFn`. If not specified `window` object is used as a scope.
- `listenThisWindow(optional)` - if *true*, then `handlerFn` is called even if the event is raised in this window. Otherwise `handlerFn` is called only when event is raised in other windows.

####Description:
`on` allows to subscribe on a specific event.

####Example:
```js
var myObject = {
    eventHandler: function (param1, param2) {
        console.log(param1 + '-' + param2);//'val1-val2'
        this.anotherFn();//this === myObject
    },

    allWindowsEventHandler: function (param1, param2) {
        console.log(param1 + '-' + param2);//'val1-val2'
        //this === window. So, this.anotherFn() will fail
    },

    anotherFn: function () {}
};

SJ.iwc.EventBus.on('someevent', myObject.eventHandler, myObject);
SJ.iwc.EventBus.on('someevent', myObject.allWindowsEventHandler, null, true);

SJ.iwc.EventBus.fire('someevent', 'val1', 'val2');
//Only allWindowsEventHandler will be called, because eventHandler listens only to other windows

//Somewhere in another window
SJ.iwc.EventBus.fire('someevent', 'val1', 'val2');
//This will call both eventHandler and allWindowsEventHandler
```

###Single event subscription
`SJ.iwc.EventBus.once({string}eventName, handlerFn, [scope], [{bool}listenThisWindow])`

####Description:
`once` allows to subscribe on a specific event and to handle it only once. So, once event is handled, handler will be automatically unsubscribed.

###Unsubscription
`SJ.iwc.EventBus.un({string}eventName, handlerFn, [scope], [{bool}listenThisWindow])`

####Parameters:
- `eventName` - name of the event to unsubscribe from.
- `handlerFn` - the function specified on subscription.
- `scope(optional)` - the scope specified on subscription.
- `listenThisWindow(optional)` - must the same as specified on subscription.

####Description:
`un` allows to unsubscribe from a specific event. `eventName`, `handlerFn`, `scope` and `listenThisWindow` must be the same as specified on subscription.

####Example:
```js
var myObject = {
    eventHandler: function () {}
};
//subscription 1 with myObject scope
SJ.iwc.EventBus.on('someevent', myObject.eventHandler, myObject);
//subscription 2 with window scope
SJ.iwc.EventBus.on('someevent', myObject.eventHandler);
//Unsubscribe subscription 1
SJ.iwc.EventBus.un('someevent', myObject.eventHandler, myObject);
//subscription 2 is still actual
```

###Event raising
`SJ.iwc.EventBus.fire({string}eventName, [parameter1, parameter2, parameter3, ...])`

####Parameters:
- `eventName` - name of the event to raise.
- `parameter1, parameter2, parameter3, ...` - optional parameters which are passed to event handlers as function parameters.

####Description:
`fire` allows to raise a specific event wich will be broadcasted to all windows with the same origin.


##WindowMonitor (SJ.iwc.WindowMonitor)
Tracks the state of windows within the same origin. WindowMonitor methods:

- `getThisWindowId` - returns the id of this window.
- `isWindowOpen` - checks if specified window is open.
- `onWindowsChanged, onceWindowsChanged, unsubscribe` - subscription methods for windows change event.
- `isReady` - checks if WindowMonitor is initialized and ready to use.
- `onReady` - sets the handler to be called once the WindowMonitor is initialized.
- `setFocus` - sets the focus to specified window.

`isWindowOpen` method will work properly only after WindowMonitor is initialized (use `isReady` or `onReady` methods). This happens because WindowMonitor uses interlocked calls which are executed asynchronously.

###getThisWindowId
`{string} SJ.iwc.WindowMonitor.getThisWindowId()`

####Return value:
Returns the id of this window. If window has name (`window.name`), then it is used as window id. Otherwise id generated using GUID generator.

###isReady
`{bool} SJ.iwc.WindowMonitor.isReady()`

####Return value:
Returns *true* if WindowMonitor initialized.

####Description:
checks if WindowMonitor is initialized and ready to use.

###onReady
`SJ.iwc.WindowMonitor.onReady(handlerFn, [scope])`

####Parameters:
- `handlerFn` - function which is called after WindowMonitor initialized.
- `scope(optional)` - is used to set the scope of `handlerFn`. If not specified `window` object is used as a scope.

####Description:
`onReady` notifies about WindowMonitor initialization. If `onReady` is used when WindowMonitor already initialized, `handlerFn` will be called immediatelly.

####Example:
```js
//It is supposed that window with name 'someWindowId' has been already opened
if (SJ.iwc.WindowMonitor.isReady()) {
    SJ.iwc.WindowMonitor.onReady(function () {
        //this is called immediatelly (synchronously)
        SJ.iwc.WindowMonitor.isWindowOpen('someWindowId');//true
    });
} else {
    SJ.iwc.WindowMonitor.onReady(function () {
        //this is called asynchronously
        SJ.iwc.WindowMonitor.isWindowOpen('someWindowId');//true
    });
}
```

###setFocus
`SJ.iwc.WindowMonitor.setFocus([{string}windowId])`

####Parameters:
- `windowId(optional)` - the id of the window to focus on. If is not specified focus is set to this window.

####Description:
`setFocus` set focus to specified window. To set focus WindowMonitor calls `window.focus()` and blinks window title for some time.

###onWindowsChanged
`SJ.iwc.WindowMonitor.onWindowsChanged(handlerFn, [scope])`

####Parameters:
- `handlerFn` - function which is called when windows are closed or opened. Handler function sigature:

    `handlerFn({array of string}openWindows, {array of string}closedWindows)`
    - `openWindows` - an array of ids of new opened windows.
    - `closedWindows` - an array of ids of closed windows.
- `scope(optional)` - is used to set the scope of `handlerFn`. If not specified `window` object is used as a scope.

####Description:
If some window is opened or closed (or even crashed), WindowMonitor notifies its subscribers about that. WindowMonitor allows to handle situations when several windows are closed or opened simultaniously.

####Example:
```js
SJ.iwc.WindowMonitor.onWindowsChanged(function (openWindows, closedWindows) {
    //It is supposed that after subscription window with name 'closedWindowId' is closed and window with name 'openWindow' is opened.
    if (openWindows.length) {
        console.log(openWindows[0]);//'openWindow'
    } else if (closedWindows.length) {
        console.log(closedWindows[0]);//'closedWindowId'
    }
});
```

###onceWindowsChanged
`SJ.iwc.EventBus.onceWindowsChanged(handlerFn, [scope])`

####Description:
`onceWindowsChanged` allows to subscribe on windows change event and to handle it only once. So, once event is handled, handler will be automatically unsubscribed.

###unsubscribe
`SJ.iwc.EventBus.unsubscribe(handlerFn, [scope])`

####Parameters:
- `handlerFn` - the function specified on subscription.
- `scope(optional)` - the scope specified on subscription.

####Description:
`unsubscribe` allows to unsubscribe from a windows change event. `handlerFn` and  `scope` must be the same as specified on subscription.

##SharedData (SJ.iwc.SharedData)
`SJ.iwc.SharedData` is a type. It allows to create data objects which are shared between windows. All data changes done in one window are replicated to all other windws of the same origin.

SharedData members:

- `get` - return the underlying data.
- `set` - checks if specified window is open.
- `change` - subscription methods for windows change event.
- `onChanged, onceChanged, unsubscribe` - subscription methods for data change event.

###constructor
`new SJ.iwc.SharedData({string}dataId)`

####Parameters:
- `dataId` - the id of the data to be identified in different windows.

####Description:
Creates new SharedData object which is bound to the data object identified by `dataId`.

###get
`{string} get()`

####Return value:
Returns bound data object.

###set
`set({object}dataValue)`

####Parameters:
- `dataValue` - data object to be used as new bound data object.

####Description:
Sets new value for bound data object.

###change
`change(delegateFn)`

####Parameters:
- `delegateFn` - function which is called to perform changes to bound data object. Delegate function sigature:

    `{object} delegateFn({object}currentDataValue)`
    - `currentDataValue` - current value of the bound data object.
    
    ####Return value:
`delegateFn` must return new value to be set to bound data object 

####Description:
`change` allow to safely change the bound data object. `delegateFn` is executed in interlocked call. This guarantees that read (performed internally), modify (is delegated to `delegateFn`) and write (performed internally) operations are executed as one atomic operation.

####Example:
```js
//It is supposed that this example code is executed for the first time for this origin
var shredData = new SJ.iwc.SharedData('sharedDataId');
sharedData.set({
    dataField: 'fieldValue'
});

//In another window
var shredData = new SJ.iwc.SharedData('sharedDataId');
sharedData.change(function (currentDataValue) {
    if (currentDataValue) {//may be null and may be an object { dataField: 'fieldValue' }
        console.log(currentDataValue.dataField);//'fieldValue'
        console.log(sharedData.get().dataField);//'fieldValue'
        console.log(sharedData.get().dataField);//'fieldValue'
        //Because we are inside of interlocked call, it is guaranteed that underlying bound data object is not changed outside in other widows
    }
    return {
        dataField: 'newValue'
    };
});
```
###onChanged
`onChanged(handlerFn, [scope])`

####Parameters:
- `handlerFn` - function which is called when underlying data is changed. Handler function sigature:

    `handlerFn({object}currentDataValue)`
    - `currentDataValue` - current value of the bound data object.
- `scope(optional)` - is used to set the scope of `handlerFn`. If not specified `window` object is used as a scope.

####Description:
If shared data is changed (in this window or in others), subscripbers are notified about that. 

###onceChanged
`onceChanged(handlerFn, [scope])`

####Description:
`onceChanged` allows to subscribe on data change event and to handle it only once. So, once event is handled, handler will be automatically unsubscribed.

###unsubscribe
`unsubscribe(handlerFn, [scope])`

####Parameters:
- `handlerFn` - the function specified on subscription.
- `scope(optional)` - the scope specified on subscription.

####Description:
`unsubscribe` allows to unsubscribe from data change event. `handlerFn` and  `scope` must be the same as specified on subscription.

##SJ.localStorage
As it is noted above **IWC** doesn't use localStorage directly - it is accessed via wrapper `SJ.localStorage`. This wrapper is intended to encapsulate some browser specific issues like event subscription, event data bugs. Also it provies some additional usefull functions.

SJ.localStorage members:

- `getItem, setItem, removeItem` - are the same as in original localStorage.
- `forEach` - iterates through all items in localStorage.
- `setVersion` - allows to clear obsolete items in localStorage.
- `onChanged, onceChanged, unsubscribe` - subscription methods for storage change event.

###forEach
`SJ.localStorage.forEach(fn)`

####Parameters:
- `fn` - function to be called for every item in localStorage. Function sigature:

    `{bool}fn({string}key, {string}value)`
    - `key` - item key.
    - `value` - item value.

    ####Return value:
If `fn` returns *false* iterating is stopped.

####Description:
Iterates through all items in localStorage.

###onChanged
`SJ.localStorage.onChanged(handlerFn, [scope], [{bool}listenThisWindow])`

####Parameters:
- `handlerFn` - function which is called when local storage is changed. Handler function sigature:
    `handlerFn({object}event)`
    - `event` - 'storage' event object according to original localStorage specification.
- `scope(optional)` - is used to set the scope of `handlerFn`. If not specified `window` object is used as a scope.
- `listenThisWindow(optional)` - if *true*, then `handlerFn` is called even if storage change is done in this window. Otherwise `handlerFn` is called only when localStorage is changed in other windows.

####Description:
If store is changed subscripbers are notified about that. 

###onceChanged
`SJ.localStorage.onceChanged(handlerFn, [scope], [{bool}listenThisWindow])`

####Description:
`onceChanged` allows to subscribe on storage change event and to handle it only once. So, once event is handled, handler will be automatically unsubscribed.

###unsubscribe
`SJ.localStorage.unsubscribe(handlerFn, [scope], [{bool}listenThisWindow])`

####Parameters:
- `handlerFn` - the function specified on subscription.
- `scope(optional)` - the scope specified on subscription.
- `listenThisWindow(optional)` - must the same as specified on subscription.

####Description:
`unsubscribe` allows to unsubscribe from data change event. `handlerFn`,  `scope` and `listenThisWindow` must be the same as specified on subscription.

###setVersion
`SJ.localStorage.setVersion({string}storagePrefix, {string}version)`

####Parameters:
- `storagePrefix` - storage key prefix.
- `version` - key prefix version.

####Description:
localStorage stores the data to disk, so it's not cleared even after PC reboot. 
localStorage is often used to store serialized objects. 
If object structure is changed it may cause unpredictable behaviour of your application because local storage may have serialized object with obsolete structure.
To avoid such situations it is recommended to use common key prefix for localStorage items which hold such structure critical objects.

`setVersion` is intended o help with prefix version tracking.
If specified prefix version differs from current version, all items with specified prefix will be removed from localStorage.

##Applicaion isolation
If you have several different applications under the same origin (e.g. myHost/app1 and myHost/app2), specify the application name in global variable `window.applicationName`. This will isolate IWC's events and locks for each application (browser isolates local storages only for different origins).
