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
    }

    async init() {
        await this.storage.init();
        await this.loadOverlays();
        
        // Load built-in overlays
        await this.builtinOverlays.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Overlay manager initialized');
    }

    async loadOverlays() {
        this.overlays = await this.storage.getAllOverlays();
        
        // Add built-in overlays
        const builtins = this.builtinOverlays.getOverlays();
        this.overlays = [...builtins, ...this.overlays];
        
        // Set default overlay if none active
        if (!this.activeOverlay && this.overlays.length > 0) {
            this.activeOverlay = this.overlays[0];
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
            
            // Update UI
            this.updateUI();
            
            console.log(`Active overlay: ${overlay.name}`);
        }
    }

    clearActiveOverlay() {
        this.activeOverlay = null;
        this.renderer.clear();
        this.updateUI();
        console.log('Overlay cleared');
    }

    async handleUploadedOverlay(file) {
        try {
            const overlay = await this.storage.saveOverlay(file);
            this.overlays.push(overlay);
            this.setActiveOverlay(overlay.id);
            this.updateUI();
            
            this.showToast('Overlay uploaded successfully');
        } catch (error) {
            console.error('Failed to upload overlay:', error);
            this.showToast('Failed to upload overlay');
        }
    }

    async deleteOverlay(overlayId) {
        // Don't delete built-in overlays
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (overlay && overlay.type === 'builtin') {
            this.showToast('Cannot delete built-in overlays');
            return;
        }
        
        try {
            await this.storage.deleteOverlay(overlayId);
            
            // Remove from local array
            this.overlays = this.overlays.filter(o => o.id !== overlayId);
            
            // If active overlay was deleted, clear it
            if (this.activeOverlay && this.activeOverlay.id === overlayId) {
                this.clearActiveOverlay();
            }
            
            this.updateUI();
            this.showToast('Overlay deleted');
        } catch (error) {
            console.error('Failed to delete overlay:', error);
            this.showToast('Failed to delete overlay');
        }
    }

    updateAspectRatio(ratio, width, height) {
        this.aspectRatio = ratio;
        this.previewWidth = width;
        this.previewHeight = height;
        
        if (this.activeOverlay) {
            this.renderer.updateSize(width, height);
        }
    }

    async drawOverlayOnPhoto(ctx, photoWidth, photoHeight) {
        if (!this.activeOverlay) return;
        
        const overlayData = this.activeOverlay.type === 'builtin' 
            ? this.activeOverlay.data 
            : await this.loadOverlayImage(this.activeOverlay.url);
        
        if (overlayData) {
            const scaleInfo = this.scaling.calculateScale(
                overlayData.width,
                overlayData.height,
                photoWidth,
                photoHeight,
                this.aspectRatio
            );
            
            ctx.globalAlpha = 0.5; // Semi-transparent overlay
            ctx.drawImage(
                overlayData,
                scaleInfo.x,
                scaleInfo.y,
                scaleInfo.width,
                scaleInfo.height
            );
            ctx.globalAlpha = 1.0;
        }
    }

    async loadOverlayImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
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