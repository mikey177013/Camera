import MenuController from './menu-controller.js';
import ShutterButton from './shutter-button.js';
import AspectRatioUI from './aspect-ratio-ui.js';
import Orientation from './orientation.js';
import Vibration from './vibration.js';

class UIController {
    constructor() {
        this.cameraController = null;
        this.overlayManager = null;
        
        this.menuController = new MenuController();
        this.shutterButton = new ShutterButton();
        this.aspectRatioUI = new AspectRatioUI();
        this.orientation = new Orientation();
        this.vibration = new Vibration();
        
        this.toastTimeout = null;
    }

    init() {
        this.menuController.init();
        this.shutterButton.init();
        this.aspectRatioUI.init();
        this.orientation.init();
        
        this.setupEventListeners();
        console.log('UI controller initialized');
    }

    setCameraController(cameraController) {
        this.cameraController = cameraController;
        this.shutterButton.setCameraController(cameraController);
    }

    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
        this.menuController.setOverlayManager(overlayManager);
    }

    setupEventListeners() {
        // Toast notifications
        document.addEventListener('showToast', (e) => {
            this.showToast(e.detail.message, e.detail.type);
        });

        // Camera switch button
        const switchButton = document.getElementById('switch-camera-button');
        if (switchButton) {
            switchButton.addEventListener('click', () => {
                this.vibration.vibrate(50);
            });
        }

        // Menu button
        const menuButton = document.getElementById('menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.menuController.toggleMenu();
                this.vibration.vibrate(30);
            });
        }
    }

    updateOverlayList(overlays, activeOverlay) {
        this.menuController.updateOverlayList(overlays, activeOverlay);
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
            clearTimeout(this.toastTimeout);
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style based on type
        switch (type) {
            case 'error':
                toast.style.background = 'rgba(255, 68, 68, 0.9)';
                break;
            case 'success':
                toast.style.background = 'rgba(76, 175, 80, 0.9)';
                break;
            default:
                toast.style.background = 'rgba(0, 0, 0, 0.8)';
        }
        
        document.body.appendChild(toast);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto hide
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    updateCameraState(state) {
        // Update UI based on camera state
        const shutterButton = document.getElementById('shutter-button');
        if (shutterButton) {
            shutterButton.dataset.state = state;
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('p').textContent = message;
            loading.style.display = 'flex';
            loading.style.opacity = '1';
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

    getOrientation() {
        return this.orientation.getOrientation();
    }
}

export default UIController;