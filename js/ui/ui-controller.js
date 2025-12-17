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
        this.isOverlayDraggable = true; // Enable dragging by default
        
        this.setupOverlayInteractionEvents();
    }

    init() {
        this.menuController.init();
        this.shutterButton.init();
        this.aspectRatioUI.init();
        this.orientation.init();
        
        this.setupEventListeners();
        this.setupOverlayControls();
        console.log('UI controller initialized');
    }

    setCameraController(cameraController) {
        this.cameraController = cameraController;
        this.shutterButton.setCameraController(cameraController);
    }

    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
        this.menuController.setOverlayManager(overlayManager);
        
        // Make overlay manager globally accessible for renderer
        window.overlayManager = overlayManager;
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
        
        // Overlay interaction events
        document.addEventListener('overlayInteraction', (e) => {
            this.handleOverlayInteraction(e.detail.interacting);
        });
    }

    setupOverlayInteractionEvents() {
        // Listen for overlay position changes
        document.addEventListener('overlayPositionChanged', (e) => {
            this.showPositionHint(e.detail);
        });
    }

    setupOverlayControls() {
        // Create overlay control panel if it doesn't exist
        if (!document.getElementById('overlay-controls')) {
            this.createOverlayControlPanel();
        }
    }

    createOverlayControlPanel() {
        const controls = document.createElement('div');
        controls.id = 'overlay-controls';
        controls.className = 'overlay-controls';
        controls.innerHTML = `
            <div class="overlay-controls-header">
                <span>Composition Guide Controls</span>
                <button id="close-overlay-controls" class="icon-button small">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            <div class="overlay-controls-content">
                <div class="control-group">
                    <label>Draggable:</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-draggable" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="control-group">
                    <label>Opacity:</label>
                    <input type="range" id="overlay-opacity" min="0.1" max="1" step="0.1" value="0.7">
                    <span id="opacity-value">70%</span>
                </div>
                <div class="control-group">
                    <button id="reset-overlay" class="control-button">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                        Reset Position
                    </button>
                </div>
                <div class="control-group">
                    <button id="lock-overlay" class="control-button">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        Lock Guide
                    </button>
                </div>
                <div class="guide-disclaimer">
                    <p>💡 <strong>Composition Guide Controls:</strong></p>
                    <p>• Drag to reposition guide</p>
                    <p>• Pinch to resize guide</p>
                    <p>• Two-finger rotate guide</p>
                    <p>• Double-click to reset guide</p>
                    <p>• <strong>Guide is NOT saved with photos</strong></p>
                </div>
            </div>
        `;
        
        document.body.appendChild(controls);
        
        // Setup control event listeners
        this.setupControlEventListeners();
    }

    setupControlEventListeners() {
        // Toggle draggable
        const toggleDraggable = document.getElementById('toggle-draggable');
        if (toggleDraggable) {
            toggleDraggable.addEventListener('change', (e) => {
                this.setOverlayDraggable(e.target.checked);
            });
        }
        
        // Opacity control
        const opacitySlider = document.getElementById('overlay-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                opacityValue.textContent = `${value}%`;
                this.setOverlayOpacity(e.target.value);
            });
        }
        
        // Reset button
        const resetButton = document.getElementById('reset-overlay');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetOverlayPosition();
                this.vibration.vibrate(50);
            });
        }
        
        // Lock button
        const lockButton = document.getElementById('lock-overlay');
        if (lockButton) {
            lockButton.addEventListener('click', () => {
                this.toggleOverlayLock();
                this.vibration.vibrate(30);
            });
        }
        
        // Close controls
        const closeButton = document.getElementById('close-overlay-controls');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideOverlayControls();
            });
        }
    }

    setOverlayDraggable(draggable) {
        this.isOverlayDraggable = draggable;
        
        if (this.overlayManager && this.overlayManager.renderer) {
            this.overlayManager.renderer.setDraggable(draggable);
        }
        
        // Update UI
        const canvas = document.getElementById('overlay-canvas');
        if (canvas) {
            canvas.style.cursor = draggable ? 'grab' : 'default';
        }
        
        this.showToast(draggable ? 'Guide dragging enabled' : 'Guide dragging disabled');
    }

    setOverlayOpacity(opacity) {
        if (this.overlayManager) {
            this.overlayManager.setOverlayOpacity(opacity);
            this.showToast(`Guide opacity: ${Math.round(opacity * 100)}%`);
        }
    }

    resetOverlayPosition() {
        if (this.overlayManager && this.overlayManager.renderer) {
            this.overlayManager.renderer.setPosition({
                offsetX: 0,
                offsetY: 0,
                scale: 1.0,
                rotation: 0
            });
            
            // Save reset position
            this.overlayManager.saveOverlayPosition({
                offsetX: 0,
                offsetY: 0,
                scale: 1.0,
                rotation: 0
            });
            
            this.showToast('Guide position reset');
        }
    }

    toggleOverlayLock() {
        const lockButton = document.getElementById('lock-overlay');
        if (lockButton) {
            const isLocked = lockButton.classList.contains('locked');
            
            if (isLocked) {
                // Unlock
                this.setOverlayDraggable(true);
                lockButton.classList.remove('locked');
                lockButton.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    Lock Guide
                `;
                this.showToast('Guide unlocked');
            } else {
                // Lock
                this.setOverlayDraggable(false);
                lockButton.classList.add('locked');
                lockButton.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2h1c1.1 0 2 .9 2 2v10c0 1.1.9 2 2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2z"/>
                    </svg>
                    Unlock Guide
                `;
                this.showToast('Guide locked');
            }
        }
    }

    handleOverlayInteraction(isInteracting) {
        // Show/hide overlay controls based on interaction
        if (isInteracting) {
            this.showOverlayControls();
        }
        
        // Update UI elements during interaction
        const shutterButton = document.getElementById('shutter-button');
        const switchButton = document.getElementById('switch-camera-button');
        const cameraContainer = document.querySelector('.camera-container');
        
        if (shutterButton) {
            shutterButton.style.opacity = isInteracting ? '0.5' : '1';
            shutterButton.style.pointerEvents = isInteracting ? 'none' : 'auto';
        }
        
        if (switchButton) {
            switchButton.style.opacity = isInteracting ? '0.5' : '1';
            switchButton.style.pointerEvents = isInteracting ? 'none' : 'auto';
        }
        
        if (cameraContainer) {
            if (isInteracting) {
                cameraContainer.classList.add('interacting');
            } else {
                cameraContainer.classList.remove('interacting');
            }
        }
    }

    showOverlayControls() {
        const controls = document.getElementById('overlay-controls');
        if (controls) {
            controls.classList.add('visible');
        }
    }

    hideOverlayControls() {
        const controls = document.getElementById('overlay-controls');
        if (controls) {
            controls.classList.remove('visible');
        }
    }

    showPositionHint(position) {
        // Create or update position hint
        let hint = document.getElementById('position-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'position-hint';
            hint.className = 'position-hint';
            document.body.appendChild(hint);
        }
        
        hint.innerHTML = `
            <div class="hint-title">Guide Position</div>
            <div class="hint-row">
                <span>X:</span>
                <span>${Math.round(position.offsetX)}px</span>
            </div>
            <div class="hint-row">
                <span>Y:</span>
                <span>${Math.round(position.offsetY)}px</span>
            </div>
            <div class="hint-row">
                <span>Scale:</span>
                <span>${position.scale.toFixed(2)}x</span>
            </div>
            <div class="hint-row">
                <span>Rotation:</span>
                <span>${Math.round(position.rotation)}°</span>
            </div>
        `;
        
        hint.classList.add('visible');
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            hint.classList.remove('visible');
        }, 2000);
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
            case 'warning':
                toast.style.background = 'rgba(255, 193, 7, 0.9)';
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