class OverlayRenderer {
    constructor() {
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentOverlay = null;
        this.overlayImage = null;
        
        this.width = 0;
        this.height = 0;
        
        // Draggable overlay properties
        this.isDraggable = true;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        this.rotation = 0;
        
        // Current aspect ratio
        this.currentAspectRatio = '4:3';
        
        // Interaction state
        this.isDragging = false;
        this.lastDragX = 0;
        this.lastDragY = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.canvas) return;
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Wheel for zoom
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Double click to reset
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Listen for aspect ratio changes
        document.addEventListener('aspectRatioChanged', (e) => {
            this.currentAspectRatio = e.detail.ratio;
            if (this.currentOverlay) {
                this.render();
            }
        });
    }

    handleTouchStart(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        this.isDragging = true;
        this.lastDragX = touch.clientX - rect.left;
        this.lastDragY = touch.clientY - rect.top;
        
        this.canvas.style.cursor = 'grabbing';
        this.triggerOverlayInteraction(true);
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        const deltaX = currentX - this.lastDragX;
        const deltaY = currentY - this.lastDragY;
        
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        
        this.lastDragX = currentX;
        this.lastDragY = currentY;
        
        this.render();
    }

    handleTouchEnd(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
        this.triggerOverlayInteraction(false);
        
        this.savePosition();
    }

    handleMouseDown(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        
        this.isDragging = true;
        this.lastDragX = e.clientX - rect.left;
        this.lastDragY = e.clientY - rect.top;
        
        this.canvas.style.cursor = 'grabbing';
        this.triggerOverlayInteraction(true);
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const deltaX = currentX - this.lastDragX;
        const deltaY = currentY - this.lastDragY;
        
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        
        this.lastDragX = currentX;
        this.lastDragY = currentY;
        
        this.render();
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
        this.triggerOverlayInteraction(false);
        
        this.savePosition();
    }

    handleWheel(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const wheelDelta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        
        this.scale += wheelDelta;
        this.scale = Math.max(0.1, Math.min(3, this.scale));
        
        this.render();
        this.savePosition();
    }

    handleDoubleClick(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        this.rotation = 0;
        
        this.render();
        this.savePosition();
    }

    triggerOverlayInteraction(isInteracting) {
        const event = new CustomEvent('overlayInteraction', {
            detail: { interacting: isInteracting }
        });
        document.dispatchEvent(event);
    }

    savePosition() {
        if (window.overlayManager) {
            window.overlayManager.saveOverlayPosition({
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                scale: this.scale,
                rotation: this.rotation
            });
        }
    }

    async setOverlay(overlaySource) {
        try {
            if (typeof overlaySource === 'string') {
                this.overlayImage = await this.loadImage(overlaySource);
            } else if (overlaySource instanceof HTMLCanvasElement) {
                this.overlayImage = overlaySource;
            } else {
                this.overlayImage = overlaySource;
            }
            
            this.currentOverlay = overlaySource;
            
            // Reset position for new overlay
            this.offsetX = 0;
            this.offsetY = 0;
            this.scale = 1.0;
            this.rotation = 0;
            
            // Load saved position if available
            if (window.overlayManager && this.overlayImage) {
                const savedPosition = await window.overlayManager.loadOverlayPosition(this.overlayImage.src);
                if (savedPosition) {
                    this.offsetX = savedPosition.offsetX || 0;
                    this.offsetY = savedPosition.offsetY || 0;
                    this.scale = savedPosition.scale || 1.0;
                    this.rotation = savedPosition.rotation || 0;
                }
            }
            
            this.render();
        } catch (error) {
            console.error('Failed to set overlay:', error);
            throw error;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    updateSize(width, height) {
        this.width = width;
        this.height = height;
        
        if (this.canvas) {
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            this.canvas.width = width;
            this.canvas.height = height;
            
            if (this.currentOverlay) {
                this.render();
            }
        }
    }

    updateAspectRatio(aspectRatio, width, height) {
        this.currentAspectRatio = aspectRatio;
        this.updateSize(width, height);
    }

    render() {
        if (!this.overlayImage || !this.ctx || this.width === 0 || this.height === 0) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate the cropped area based on aspect ratio
        const [ratioW, ratioH] = this.currentAspectRatio.split(':').map(Number);
        const targetRatio = ratioW / ratioH;
        const canvasRatio = this.width / this.height;
        
        let cropWidth, cropHeight, cropX, cropY;
        
        if (canvasRatio > targetRatio) {
            // Canvas is wider than target - black bars on sides
            cropHeight = this.height;
            cropWidth = cropHeight * targetRatio;
            cropX = (this.width - cropWidth) / 2;
            cropY = 0;
        } else {
            // Canvas is taller than target - black bars on top/bottom
            cropWidth = this.width;
            cropHeight = cropWidth / targetRatio;
            cropX = 0;
            cropY = (this.height - cropHeight) / 2;
        }
        
        // Calculate overlay dimensions to fit the cropped area
        const imgAspect = this.overlayImage.width / this.overlayImage.height;
        const cropAspect = cropWidth / cropHeight;
        
        let fitWidth, fitHeight, fitX, fitY;
        
        if (cropAspect > imgAspect) {
            // Crop area is wider than overlay
            fitHeight = cropHeight;
            fitWidth = fitHeight * imgAspect;
            fitX = cropX + (cropWidth - fitWidth) / 2;
            fitY = cropY;
        } else {
            // Crop area is taller than overlay
            fitWidth = cropWidth;
            fitHeight = fitWidth / imgAspect;
            fitX = cropX;
            fitY = cropY + (cropHeight - fitHeight) / 2;
        }
        
        // Apply scale
        const scaledWidth = fitWidth * this.scale;
        const scaledHeight = fitHeight * this.scale;
        
        // Apply offsets relative to the cropped area
        const offsetScaleX = scaledWidth / fitWidth;
        const offsetScaleY = scaledHeight / fitHeight;
        
        const drawX = fitX + this.offsetX / offsetScaleX;
        const drawY = fitY + this.offsetY / offsetScaleY;
        
        // Save context state
        this.ctx.save();
        
        // Draw only within the cropped area
        this.ctx.beginPath();
        this.ctx.rect(cropX, cropY, cropWidth, cropHeight);
        this.ctx.clip();
        
        // Move to center for rotation
        this.ctx.translate(drawX + scaledWidth / 2, drawY + scaledHeight / 2);
        
        // Apply rotation
        this.ctx.rotate(this.rotation * Math.PI / 180);
        
        // Draw overlay
        this.ctx.globalAlpha = 0.7;
        this.ctx.drawImage(
            this.overlayImage,
            -scaledWidth / 2,
            -scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        
        // Restore context
        this.ctx.restore();
        
        // Draw crop boundary for visual reference
        this.drawCropBoundary(cropX, cropY, cropWidth, cropHeight);
        
        // Draw center marker when interacting
        if (this.isDragging) {
            this.drawCenterMarker(drawX + scaledWidth / 2, drawY + scaledHeight / 2);
        }
    }

    drawCropBoundary(x, y, width, height) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.restore();
    }

    drawCenterMarker(centerX, centerY) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        
        // Draw crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 15, centerY);
        this.ctx.lineTo(centerX + 15, centerY);
        this.ctx.moveTo(centerX, centerY - 15);
        this.ctx.lineTo(centerX, centerY + 15);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    clear() {
        this.currentOverlay = null;
        this.overlayImage = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        this.rotation = 0;
        
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    setDraggable(draggable) {
        this.isDraggable = draggable;
        if (this.canvas) {
            this.canvas.style.cursor = draggable ? 'grab' : 'default';
        }
    }

    getPosition() {
        return {
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            scale: this.scale,
            rotation: this.rotation
        };
    }

    setPosition(position) {
        if (position) {
            this.offsetX = position.offsetX || 0;
            this.offsetY = position.offsetY || 0;
            this.scale = position.scale || 1.0;
            this.rotation = position.rotation || 0;
            this.render();
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    isRendering() {
        return this.currentOverlay !== null;
    }
}

export default OverlayRenderer;