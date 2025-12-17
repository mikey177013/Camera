// Main app initialization
import CameraController from '../camera/camera-controller.js';
import UIController from '../ui/ui-controller.js';
import OverlayManager from '../overlay/overlay-manager.js';
import { initPWA } from './pwa-manager.js';

class App {
    constructor() {
        this.cameraController = null;
        this.uiController = null;
        this.overlayManager = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Hide loading screen
            this.hideLoading();

            // Initialize controllers
            this.cameraController = new CameraController();
            this.uiController = new UIController();
            this.overlayManager = new OverlayManager();

            // Set up controller connections
            this.uiController.setCameraController(this.cameraController);
            this.uiController.setOverlayManager(this.overlayManager);
            this.cameraController.setOverlayManager(this.overlayManager);
            this.overlayManager.setUIController(this.uiController);

            // Initialize components
            await this.cameraController.init();
            await this.overlayManager.init();
            this.uiController.init();

            // Initialize PWA
            initPWA();

            this.isInitialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize camera. Please refresh the page.');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 300);
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'toast show';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(255, 68, 68, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '12px';
        errorDiv.style.zIndex = '1000';
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Handle before install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button if needed
    console.log('PWA installation available');
});

export default App;