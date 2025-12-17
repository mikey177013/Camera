class OverlayStorage {
    constructor() {
        this.db = null;
        this.dbName = 'CompositionCameraDB';
        this.storeName = 'overlays';
        this.dbVersion = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                }
            };
        });
    }

    async saveOverlay(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const overlay = {
                        id: this.generateId(),
                        name: file.name.replace('.png', '').replace('.PNG', ''),
                        url: event.target.result,
                        type: 'custom',
                        created: new Date().toISOString(),
                        size: file.size
                    };
                    
                    await this.saveToDB(overlay);
                    resolve(overlay);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(reader.error);
            };
            
            reader.readAsDataURL(file);
        });
    }

    async saveToDB(overlay) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(overlay);
            
            request.onsuccess = () => {
                console.log('Overlay saved to DB:', overlay.id);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAllOverlays() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deleteOverlay(overlayId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(overlayId);
            
            request.onsuccess = () => {
                console.log('Overlay deleted from DB:', overlayId);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All overlays cleared from DB');
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getStorageInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return Promise.resolve(null);
        }
        
        return navigator.storage.estimate();
    }
}

export default OverlayStorage;