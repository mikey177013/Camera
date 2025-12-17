import OverlayStorage from './overlay-storage.js';
import OverlayRenderer from './overlay-renderer.js';
import BuiltinOverlays from './builtin-overlays.js';
import OverlayScaling from './overlay-scaling.js';

class OverlayManager {
    constructor() {
        this.storage = new OverlayStorage();
        this.renderer = new OverlayRenderer();
        this.builtinOverlays = new BuiltinOverlays();
        this.scaling = new OverlayScaling();
        
        this.activeOverlay = null;
        this.overlays = [];
        this.uiController = null;
        
        this.aspectRatio = '4:3';
        this.previewWidth = 0;
        this.previewHeight = 0;
        
        // Overlay transformation storage
        this.overlayPositions = new Map(); // Store positions per overlay
        this.overlayOpacity = 0.7;
        
        this.setupEventListeners();
    }

    async init() {
        await this.storage.init();
        await this.loadOverlays();
        
        // Load built-in overlays
        await this.builtinOverlays.init();
        
        // Load saved overlay positions
        await this.loadOverlayPositions();
        
        // Load saved opacity
        const savedOpacity = await this.storage.getLocal('overlayOpacity');
        if (savedOpacity) {
            this.overlayOpacity = savedOpacity;
            if (this.renderer && this.renderer.ctx) {
                this.renderer.ctx.globalAlpha = this.overlayOpacity;
            }
        }
        
        console.log('Overlay manager initialized');
    }

    async loadOverlays() {
        this.overlays = await this.storage.getAllOverlays();
        
        // Add built-in overlays
        const builtins = this.builtinOverlays.getOverlays();
        this.overlays = [...builtins, ...this.overlays];
        
        // Set default overlay if none active
        if (!this.activeOverlay && this.overlays.length > 0) {
            this.activeOverlay = this.overlays.find(o => o.id === 'none') || this.overlays[0];
        }
        
        this.updateUI();
    }

    setupEventListeners() {
        // Overlay selection
        document.addEventListener('overlaySelected', (e) => {
            this.setActiveOverlay(e.detail.id);
        });

        // Overlay upload
        document.addEventListener('overlayUploaded', async (e) => {
            await this.handleUploadedOverlay(e.detail.file);
        });

        // Clear overlay
        document.addEventListener('clearOverlay', () => {
            this.clearActiveOverlay();
        });
        
        // Save overlay position when interaction ends
        document.addEventListener('overlayInteraction', (e) => {
            if (!e.detail.interacting && this.activeOverlay) {
                this.saveCurrentOverlayPosition();
            }
        });
        
        // Handle aspect ratio changes
        document.addEventListener('aspectRatioChanged', (e) => {
            this.updateAspectRatio(e.detail.ratio, this.previewWidth, this.previewHeight);
        });
    }

    setUIController(uiController) {
        this.uiController = uiController;
    }

    async setActiveOverlay(overlayId) {
        if (overlayId === 'none') {
            this.clearActiveOverlay();
            return;
        }
        
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (overlay) {
            this.activeOverlay = overlay;
            
            // Update renderer
            if (overlay.type === 'builtin') {
                await this.renderer.setOverlay(overlay.data);
            } else {
                await this.renderer.setOverlay(overlay.url);
            }
            
            // Apply saved opacity
            if (this.renderer && this.renderer.ctx) {
                this.renderer.ctx.globalAlpha = this.overlayOpacity;
            }
            
            // Update UI
            this.updateUI();
            
            // Show controls hint
            this.showToast(`Active: ${overlay.name}. Drag to reposition guide.`);
            
            console.log(`Active overlay: ${overlay.name}`);
        }
    }

    clearActiveOverlay() {
        this.activeOverlay = null;
        this.renderer.clear();
        this.updateUI();
        this.showToast('Composition guide cleared');
        console.log('Overlay cleared');
    }

    async handleUploadedOverlay(file) {
        try {
            const overlay = await this.storage.saveOverlay(file);
            this.overlays.push(overlay);
            this.setActiveOverlay(overlay.id);
            this.updateUI();
            
            this.showToast('Custom grid uploaded successfully');
        } catch (error) {
            console.error('Failed to upload overlay:', error);
            this.showToast('Failed to upload grid');
        }
    }

    async deleteOverlay(overlayId) {
        // Don't delete built-in overlays
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (overlay && overlay.type === 'builtin') {
            this.showToast('Cannot delete built-in guides');
            return;
        }
        
        try {
            await this.storage.deleteOverlay(overlayId);
            
            // Remove from local array
            this.overlays = this.overlays.filter(o => o.id !== overlayId);
            
            // Remove saved position
            this.overlayPositions.delete(overlayId);
            await this.saveOverlayPositionsToStorage();
            
            // If active overlay was deleted, clear it
            if (this.activeOverlay && this.activeOverlay.id === overlayId) {
                this.clearActiveOverlay();
            }
            
            this.updateUI();
            this.showToast('Custom grid deleted');
        } catch (error) {
            console.error('Failed to delete overlay:', error);
            this.showToast('Failed to delete grid');
        }
    }

    updateAspectRatio(ratio, width, height) {
        this.aspectRatio = ratio;
        this.previewWidth = width;
        this.previewHeight = height;
        
        if (this.activeOverlay && this.renderer) {
            this.renderer.updateSize(width, height);
        }
    }

    // REMOVED: drawOverlayOnPhoto method - overlays are not included in photos

    async loadOverlayImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // Overlay position management
    async saveOverlayPosition(position) {
        if (!this.activeOverlay) return;
        
        const overlayId = this.activeOverlay.id;
        this.overlayPositions.set(overlayId, {
            ...position,
            timestamp: Date.now()
        });
        
        // Save to storage
        await this.saveOverlayPositionsToStorage();
        
        // Dispatch event for UI updates
        const event = new CustomEvent('overlayPositionChanged', {
            detail: position
        });
        document.dispatchEvent(event);
    }

    async saveCurrentOverlayPosition() {
        if (!this.activeOverlay || !this.renderer) return;
        
        const position = this.renderer.getPosition();
        await this.saveOverlayPosition(position);
    }

    async loadOverlayPosition(overlayId) {
        // Load from memory cache first
        if (this.overlayPositions.has(overlayId)) {
            return this.overlayPositions.get(overlayId);
        }
        
        // Try to load from storage
        try {
            const positions = await this.storage.getLocal('overlayPositions', {});
            return positions[overlayId];
        } catch (error) {
            console.error('Failed to load overlay position:', error);
            return null;
        }
    }

    async loadOverlayPositions() {
        try {
            const positions = await this.storage.getLocal('overlayPositions', {});
            
            // Convert to Map
            Object.entries(positions).forEach(([id, position]) => {
                this.overlayPositions.set(id, position);
            });
            
            console.log('Loaded overlay positions:', this.overlayPositions.size);
        } catch (error) {
            console.error('Failed to load overlay positions:', error);
        }
    }

    async saveOverlayPositionsToStorage() {
        try {
            // Convert Map to object
            const positions = {};
            this.overlayPositions.forEach((value, key) => {
                positions[key] = value;
            });
            
            await this.storage.setLocal('overlayPositions', positions);
        } catch (error) {
            console.error('Failed to save overlay positions:', error);
        }
    }

    // Opacity control
    setOverlayOpacity(opacity) {
        this.overlayOpacity = Math.max(0.1, Math.min(1, opacity));
        
        if (this.renderer && this.renderer.ctx) {
            this.renderer.ctx.globalAlpha = this.overlayOpacity;
            this.renderer.render();
        }
        
        // Save opacity setting
        this.storage.setLocal('overlayOpacity', this.overlayOpacity);
    }

    getOverlayOpacity() {
        return this.overlayOpacity;
    }

    updateUI() {
        if (this.uiController) {
            this.uiController.updateOverlayList(this.overlays, this.activeOverlay);
        }
    }

    isOverlayEnabled() {
        return this.activeOverlay !== null;
    }

    getActiveOverlay() {
        return this.activeOverlay;
    }

    getAllOverlays() {
        return this.overlays;
    }

    showToast(message) {
        if (this.uiController) {
            this.uiController.showToast(message);
        }
    }
}

export default OverlayManager;