class Storage {
    constructor() {
        this.prefix = 'camera_app_';
    }

    // Local Storage methods
    setLocal(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error('LocalStorage set error:', error);
            return false;
        }
    }

    getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return defaultValue;
        }
    }

    removeLocal(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('LocalStorage remove error:', error);
            return false;
        }
    }

    clearLocal() {
        try {
            // Only remove items with our prefix
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('LocalStorage clear error:', error);
            return false;
        }
    }

    // Session Storage methods
    setSession(key, value) {
        try {
            const serialized = JSON.stringify(value);
            sessionStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error('SessionStorage set error:', error);
            return false;
        }
    }

    getSession(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('SessionStorage get error:', error);
            return defaultValue;
        }
    }

    removeSession(key) {
        try {
            sessionStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('SessionStorage remove error:', error);
            return false;
        }
    }

    clearSession() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('SessionStorage clear error:', error);
            return false;
        }
    }

    // IndexedDB wrapper for larger data
    async openDB(name, version, upgradeCallback) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                if (upgradeCallback) {
                    upgradeCallback(event.target.result, event.oldVersion, event.newVersion);
                }
            };
        });
    }

    // Utility methods
    getStorageInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return Promise.resolve(null);
        }
        
        return navigator.storage.estimate();
    }

    isStoragePersisted() {
        if (!navigator.storage || !navigator.storage.persisted) {
            return Promise.resolve(false);
        }
        
        return navigator.storage.persisted();
    }

    async requestPersistence() {
        if (!navigator.storage || !navigator.storage.persist) {
            return false;
        }
        
        return await navigator.storage.persist();
    }

    // Settings management
    getSettings() {
        return this.getLocal('settings', {
            vibration: true,
            sound: false,
            saveToGallery: true,
            overlayOpacity: 0.7,
            defaultAspectRatio: '4:3',
            defaultCamera: 'environment'
        });
    }

    saveSettings(settings) {
        return this.setLocal('settings', settings);
    }

    // Usage statistics
    getStats() {
        return this.getLocal('stats', {
            photosTaken: 0,
            overlaysUploaded: 0,
            lastUsed: null,
            totalUsageTime: 0
        });
    }

    updateStats(updates) {
        const stats = this.getStats();
        const updated = { ...stats, ...updates, lastUsed: new Date().toISOString() };
        return this.setLocal('stats', updated);
    }

    incrementPhotoCount() {
        const stats = this.getStats();
        stats.photosTaken = (stats.photosTaken || 0) + 1;
        return this.setLocal('stats', stats);
    }

    incrementOverlayCount() {
        const stats = this.getStats();
        stats.overlaysUploaded = (stats.overlaysUploaded || 0) + 1;
        return this.setLocal('stats', stats);
    }
}

export default Storage;