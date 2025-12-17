class DeviceUtils {
    constructor() {
        this.capabilities = {};
        this.orientation = 'portrait';
        this.platform = 'unknown';
        this.touchSupport = false;
        this.pwaSupport = false;
    }

    async init() {
        await this.detectCapabilities();
        this.detectPlatform();
        this.detectTouchSupport();
        this.detectPWASupport();
    }

    async detectCapabilities() {
        this.capabilities = {
            camera: await this.checkCameraSupport(),
            vibration: 'vibrate' in navigator,
            orientation: 'orientation' in screen,
            fullscreen: 'fullscreenEnabled' in document || 
                       'webkitFullscreenEnabled' in document ||
                       'mozFullScreenEnabled' in document,
            storage: 'storage' in navigator,
            serviceWorker: 'serviceWorker' in navigator,
            webShare: 'share' in navigator,
            webShareTarget: 'share' in navigator && 'canShare' in navigator,
            clipboard: 'clipboard' in navigator && 'writeText' in navigator.clipboard,
            mediaSession: 'mediaSession' in navigator,
            deviceMemory: 'deviceMemory' in navigator,
            hardwareConcurrency: 'hardwareConcurrency' in navigator,
            gpu: this.getGPUInfo()
        };

        console.log('Device capabilities:', this.capabilities);
    }

    async checkCameraSupport() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return false;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            
            // Test camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            
            return hasCamera;
        } catch (error) {
            console.warn('Camera check failed:', error);
            return false;
        }
    }

    getGPUInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return { supported: false, info: null };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const gpuInfo = debugInfo ? {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        } : null;

        return {
            supported: true,
            info: gpuInfo
        };
    }

    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('android')) {
            this.platform = 'android';
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
            this.platform = 'ios';
        } else if (userAgent.includes('win')) {
            this.platform = 'windows';
        } else if (userAgent.includes('mac')) {
            this.platform = 'macos';
        } else if (userAgent.includes('linux')) {
            this.platform = 'linux';
        } else {
            this.platform = 'unknown';
        }

        console.log('Platform detected:', this.platform);
    }

    detectTouchSupport() {
        this.touchSupport = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           navigator.msMaxTouchPoints > 0;
        
        console.log('Touch support:', this.touchSupport);
    }

    detectPWASupport() {
        this.pwaSupport = 'serviceWorker' in navigator && 
                         'Promise' in window && 
                         'fetch' in window &&
                         'caches' in window;
        
        console.log('PWA support:', this.pwaSupport);
    }

    // Device information getters
    getPlatform() {
        return this.platform;
    }

    isMobile() {
        return this.platform === 'android' || this.platform === 'ios';
    }

    isIOS() {
        return this.platform === 'ios';
    }

    isAndroid() {
        return this.platform === 'android';
    }

    isDesktop() {
        return !this.isMobile();
    }

    hasTouch() {
        return this.touchSupport;
    }

    supportsPWA() {
        return this.pwaSupport;
    }

    supportsCamera() {
        return this.capabilities.camera;
    }

    supportsVibration() {
        return this.capabilities.vibration;
    }

    supportsOrientation() {
        return this.capabilities.orientation;
    }

    supportsFullscreen() {
        return this.capabilities.fullscreen;
    }

    // Screen information
    getScreenSize() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
    }

    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        };
    }

    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        }
        
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    // Battery information
    async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (error) {
                console.warn('Battery API not available:', error);
                return null;
            }
        }
        return null;
    }

    // Memory information
    getMemoryInfo() {
        const info = {
            deviceMemory: this.capabilities.deviceMemory || 'unknown',
            hardwareConcurrency: this.capabilities.hardwareConcurrency || 'unknown',
            gpu: this.capabilities.gpu
        };

        if ('performance' in window && 'memory' in performance) {
            info.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
            info.totalJSHeapSize = performance.memory.totalJSHeapSize;
            info.usedJSHeapSize = performance.memory.usedJSHeapSize;
        }

        return info;
    }

    // Network information
    getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                type: connection.type
            };
        }
        
        return null;
    }

    // Storage information
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usageDetails: estimate.usageDetails
                };
            } catch (error) {
                console.warn('Storage estimate failed:', error);
            }
        }
        return null;
    }

    // Device features detection
    hasNotch() {
        if (!this.isMobile()) return false;
        
        // iOS detection
        if (this.isIOS()) {
            const iosVersion = parseInt((navigator.userAgent.match(/OS (\d+)_(\d+)/) || [])[1], 10);
            return iosVersion >= 11 && window.screen.height >= 812;
        }
        
        // Android detection (simplified)
        if (this.isAndroid()) {
            const aspectRatio = window.screen.height / window.screen.width;
            return aspectRatio > 2;
        }
        
        return false;
    }

    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
            right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
            bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
            left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10)
        };
    }

    // Performance measurement
    measurePerformance() {
        const startTime = performance.now();
        
        return {
            start: startTime,
            end: () => performance.now() - startTime,
            mark: (name) => performance.mark(name),
            measure: (name, startMark, endMark) => performance.measure(name, startMark, endMark)
        };
    }

    // Device capabilities summary
    getCapabilitiesSummary() {
        return {
            platform: this.platform,
            isMobile: this.isMobile(),
            hasTouch: this.hasTouch(),
            supportsPWA: this.supportsPWA(),
            supportsCamera: this.supportsCamera(),
            screen: this.getScreenSize(),
            orientation: this.getOrientation(),
            hasNotch: this.hasNotch(),
            safeArea: this.getSafeAreaInsets(),
            network: this.getNetworkInfo(),
            memory: this.getMemoryInfo()
        };
    }
}

export default DeviceUtils;