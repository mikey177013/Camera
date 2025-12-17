class OverlayRenderer {
    constructor() {
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentOverlay = null;
        this.overlayImage = null;
        
        this.width = 0;
        this.height = 0;
        
        // Draggable overlay properties
        this.isDraggable = true; // Enable dragging
        this.offsetX = 0; // X offset from center
        this.offsetY = 0; // Y offset from center
        this.scale = 1.0; // Scale factor
        this.rotation = 0; // Rotation angle (degrees)
        
        // Pinch to zoom properties
        this.lastTouchDistance = 0;
        this.lastRotation = 0;
        
        // Interaction state
        this.isDragging = false;
        this.isRotating = false;
        this.isScaling = false;
        this.lastDragX = 0;
        this.lastDragY = 0;
        
        // Gesture recognition
        this.touchStartPoints = [];
        this.gestureMode = null; // 'drag', 'rotate', 'scale'
        
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
    }

    // Touch event handlers
    handleTouchStart(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        this.touchStartPoints = Array.from(e.touches).map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            id: touch.identifier
        }));
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        this.isDragging = true;
        this.lastDragX = touch.clientX - rect.left;
        this.lastDragY = touch.clientY - rect.top;
        
        // If two touches, prepare for rotate/scale
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Calculate initial distance for scaling
            this.lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // Calculate initial angle for rotation
            this.lastRotation = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            ) * (180 / Math.PI);
            
            this.gestureMode = 'multi-touch';
        } else {
            this.gestureMode = 'drag';
        }
        
        this.canvas.style.cursor = 'grabbing';
        this.triggerOverlayInteraction(true);
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        
        // Single touch - dragging
        if (e.touches.length === 1 && this.gestureMode === 'drag') {
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
        // Two touches - rotate and scale
        else if (e.touches.length === 2 && this.gestureMode === 'multi-touch') {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Calculate current distance
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // Calculate current angle
            const currentRotation = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            ) * (180 / Math.PI);
            
            // Apply scaling
            if (this.lastTouchDistance > 0) {
                const scaleFactor = currentDistance / this.lastTouchDistance;
                this.scale *= scaleFactor;
                this.scale = Math.max(0.1, Math.min(3, this.scale)); // Clamp scale
                this.lastTouchDistance = currentDistance;
            }
            
            // Apply rotation
            const rotationDelta = currentRotation - this.lastRotation;
            this.rotation += rotationDelta;
            this.lastRotation = currentRotation;
            
            // Calculate center point for translation during rotate/scale
            const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
            
            this.render();
        }
    }

    handleTouchEnd(e) {
        this.isDragging = false;
        this.gestureMode = null;
        this.lastTouchDistance = 0;
        this.lastRotation = 0;
        this.canvas.style.cursor = 'grab';
        this.triggerOverlayInteraction(false);
        
        // Save position if overlay manager is available
        if (window.overlayManager) {
            window.overlayManager.saveOverlayPosition({
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                scale: this.scale,
                rotation: this.rotation
            });
        }
    }

    // Mouse event handlers
    handleMouseDown(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        
        this.isDragging = true;
        this.lastDragX = e.clientX - rect.left;
        this.lastDragY = e.clientY - rect.top;
        
        this.gestureMode = 'drag';
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
        this.gestureMode = null;
        this.canvas.style.cursor = 'grab';
        this.triggerOverlayInteraction(false);
        
        // Save position if overlay manager is available
        if (window.overlayManager) {
            window.overlayManager.saveOverlayPosition({
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                scale: this.scale,
                rotation: this.rotation
            });
        }
    }

    handleWheel(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        
        // Zoom with wheel
        const zoomIntensity = 0.1;
        const wheelDelta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        
        // Calculate mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Apply zoom
        const oldScale = this.scale;
        this.scale += wheelDelta;
        this.scale = Math.max(0.1, Math.min(3, this.scale)); // Clamp scale
        
        // Adjust offset to zoom towards mouse position
        const scaleChange = this.scale - oldScale;
        this.offsetX -= (mouseX - this.width/2 - this.offsetX) * (scaleChange / oldScale);
        this.offsetY -= (mouseY - this.height/2 - this.offsetY) * (scaleChange / oldScale);
        
        this.render();
        
        // Save position
        if (window.overlayManager) {
            window.overlayManager.saveOverlayPosition({
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                scale: this.scale,
                rotation: this.rotation
            });
        }
    }

    handleDoubleClick(e) {
        if (!this.isDraggable || !this.currentOverlay) return;
        
        e.preventDefault();
        
        // Reset overlay to center with default scale
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        this.rotation = 0;
        
        this.render();
        
        // Save reset position
        if (window.overlayManager) {
            window.overlayManager.saveOverlayPosition({
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                scale: this.scale,
                rotation: this.rotation
            });
        }
    }

    triggerOverlayInteraction(isInteracting) {
        const event = new CustomEvent('overlayInteraction', {
            detail: { interacting: isInteracting }
        });
        document.dispatchEvent(event);
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

    render() {
        if (!this.overlayImage || !this.ctx || this.width === 0 || this.height === 0) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate image dimensions maintaining aspect ratio
        const imgAspect = this.overlayImage.width / this.overlayImage.height;
        const canvasAspect = this.width / this.height;
        
        let baseWidth, baseHeight;
        
        if (canvasAspect > imgAspect) {
            // Canvas is wider than image
            baseHeight = this.height;
            baseWidth = baseHeight * imgAspect;
        } else {
            // Canvas is taller than image
            baseWidth = this.width;
            baseHeight = baseWidth / imgAspect;
        }
        
        // Apply scale
        const scaledWidth = baseWidth * this.scale;
        const scaledHeight = baseHeight * this.scale;
        
        // Calculate center position
        const centerX = (this.width - scaledWidth) / 2;
        const centerY = (this.height - scaledHeight) / 2;
        
        // Apply offsets
        const drawX = centerX + this.offsetX;
        const drawY = centerY + this.offsetY;
        
        // Save context state
        this.ctx.save();
        
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
        
        // Draw center marker when interacting
        if (this.isDragging || this.gestureMode === 'multi-touch') {
            this.drawCenterMarker();
        }
    }

    drawCenterMarker() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Draw crosshair at current offset position
        const centerX = this.width / 2 + this.offsetX;
        const centerY = this.height / 2 + this.offsetY;
        
        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 20, centerY);
        this.ctx.lineTo(centerX + 20, centerY);
        this.ctx.stroke();
        
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 20);
        this.ctx.lineTo(centerX, centerY + 20);
        this.ctx.stroke();
        
        // Circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
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