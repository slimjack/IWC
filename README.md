IWC
===

Inter-window (cross-tab) communication library.

This library provides functionality for data exchange and synchronization between browser windows (tabs). It is based on localStorage.
##Features:
- **Interlocked call** guarantees that function is executed only in one window at the same time
- **Captured lock** guarantees that only one window holds the lock. Lock can be captured by another window only if holder window is closed or lock is released
- **Event bus** allows to distribute events among windows
- **WindowMonitor** tracks windows (tabs) and notifies about window closing/opening
- **Shared data** provides thread-safe access (read-modify-write operation) to data shared between windows. 