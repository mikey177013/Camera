class Orientation {
    constructor() {
        this.currentOrientation = this.getScreenOrientation();
        this.locked = false;
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Screen orientation change
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleOrientationChange();
            });
        } else {
            // Fallback for browsers without screen.orientation API
            window.addEventListener('resize', () => {
                this.handleOrientationChange();
            });
        }
        
        // Device orientation (for better mobile experience)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.handleDeviceOrientation(e);
            }, true);
        }
    }

    handleOrientationChange() {
        const newOrientation = this.getScreenOrientation();
        
        if (newOrientation !== this.currentOrientation) {
            this.currentOrientation = newOrientation;
            this.updateUI();
            
            // Dispatch event
            const event = new CustomEvent('orientationChanged', {
                detail: { orientation: newOrientation }
            });
            document.dispatchEvent(event);
            
            console.log(`Orientation changed to ${newOrientation}`);
        }
    }

    handleDeviceOrientation(event) {
        // This can be used for additional orientation-based features
        // For now, we'll just log it for debugging
        if (event.beta !== null && event.gamma !== null) {
            // Device is in motion
        }
    }

    getScreenOrientation() {
        if (screen.orientation) {
            return screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape';
        }
        
        // Fallback using window dimensions
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    updateUI() {
        const app = document.getElementById('app');
        if (app) {
            app.setAttribute('data-orientation', this.currentOrientation);
        }
        
        // Update aspect ratio selector layout
        const aspectRatioUI = document.querySelector('.aspect-ratio-selector');
        if (aspectRatioUI) {
            if (this.currentOrientation === 'landscape') {
                aspectRatioUI.classList.add('landscape');
                aspectRatioUI.classList.remove('portrait');
            } else {
                aspectRatioUI.classList.add('portrait');
                aspectRatioUI.classList.remove('landscape');
            }
        }
    }

    getOrientation() {
        return this.currentOrientation;
    }

    isPortrait() {
        return this.currentOrientation === 'portrait';
    }

    isLandscape() {
        return this.currentOrientation === 'landscape';
    }

    lock(orientation) {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock(orientation)
                .then(() => {
                    this.locked = true;
                    console.log(`Orientation locked to ${orientation}`);
                })
                .catch(error => {
                    console.warn('Failed to lock orientation:', error);
                });
        }
    }

    unlock() {
        if (screen.orientation && screen.orientation.unlock && this.locked) {
            screen.orientation.unlock();
            this.locked = false;
            console.log('Orientation unlocked');
        }
    }
}

export default Orientation;