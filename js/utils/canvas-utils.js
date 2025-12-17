class CanvasUtils {
    constructor() {
        // Default settings
        this.defaults = {
            imageQuality: 0.92,
            overlayOpacity: 0.7,
            lineWidth: 2,
            gridColor: 'rgba(255, 255, 255, 0.7)'
        };
    }

    // Create a canvas element
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    // Clear canvas
    clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw image to canvas
    drawImage(canvas, image, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            x = 0,
            y = 0,
            width = canvas.width,
            height = canvas.height,
            opacity = 1.0,
            compositeOperation = 'source-over'
        } = options;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = compositeOperation;
        ctx.drawImage(image, x, y, width, height);
        ctx.restore();
    }

    // Draw overlay on canvas with proper scaling
    drawOverlay(canvas, overlayImage, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            mode = 'center-fit', // 'center-fit', 'center-crop', 'stretch'
            opacity = this.defaults.overlayOpacity,
            maintainAspectRatio = true
        } = options;

        if (!overlayImage) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const overlayWidth = overlayImage.width;
        const overlayHeight = overlayImage.height;

        let drawWidth, drawHeight, drawX, drawY;

        switch (mode) {
            case 'center-fit':
                const fitScale = Math.min(
                    canvasWidth / overlayWidth,
                    canvasHeight / overlayHeight
                );
                drawWidth = overlayWidth * fitScale;
                drawHeight = overlayHeight * fitScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
                break;

            case 'center-crop':
                const cropScale = Math.max(
                    canvasWidth / overlayWidth,
                    canvasHeight / overlayHeight
                );
                drawWidth = overlayWidth * cropScale;
                drawHeight = overlayHeight * cropScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
                break;

            case 'stretch':
                drawWidth = canvasWidth;
                drawHeight = canvasHeight;
                drawX = 0;
                drawY = 0;
                break;

            default:
                return;
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(overlayImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
    }

    // Draw composition guides
    drawRuleOfThirds(canvas, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            color = this.defaults.gridColor,
            lineWidth = this.defaults.lineWidth,
            opacity = 0.7,
            drawIntersectionPoints = true
        } = options;

        const width = canvas.width;
        const height = canvas.height;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = opacity;
        ctx.setLineDash([5, 5]);

        // Draw vertical lines
        ctx.beginPath();
        ctx.moveTo(width / 3, 0);
        ctx.lineTo(width / 3, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(width * 2 / 3, 0);
        ctx.lineTo(width * 2 / 3, height);
        ctx.stroke();

        // Draw horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, height / 3);
        ctx.lineTo(width, height / 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, height * 2 / 3);
        ctx.lineTo(width, height * 2 / 3);
        ctx.stroke();

        // Draw intersection points
        if (drawIntersectionPoints) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([]);

            const points = [
                { x: width / 3, y: height / 3 },
                { x: width * 2 / 3, y: height / 3 },
                { x: width / 3, y: height * 2 / 3 },
                { x: width * 2 / 3, y: height * 2 / 3 }
            ];

            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        ctx.restore();
    }

    drawGoldenRatio(canvas, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            color = this.defaults.gridColor,
            lineWidth = this.defaults.lineWidth,
            opacity = 0.7
        } = options;

        const width = canvas.width;
        const height = canvas.height;
        const goldenRatio = 1.618;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = opacity;
        ctx.setLineDash([3, 3]);

        // Draw golden ratio lines
        const positions = [
            { pos: width / goldenRatio, vertical: true },
            { pos: height / goldenRatio, vertical: false },
            { pos: width - (width / goldenRatio), vertical: true },
            { pos: height - (height / goldenRatio), vertical: false }
        ];

        positions.forEach(({ pos, vertical }) => {
            ctx.beginPath();
            if (vertical) {
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, height);
            } else {
                ctx.moveTo(0, pos);
                ctx.lineTo(width, pos);
            }
            ctx.stroke();
        });

        ctx.restore();
    }

    drawCrosshair(canvas, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            color = this.defaults.gridColor,
            lineWidth = this.defaults.lineWidth,
            opacity = 0.7,
            size = 20
        } = options;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = opacity;

        // Draw crosshair
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(centerX - size, centerY);
        ctx.lineTo(centerX + size, centerY);
        // Vertical line
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX, centerY + size);
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // Image manipulation
    async applyFilter(canvas, filterType) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        switch (filterType) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
                break;

            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;

            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];     // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
                break;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Canvas to data URL with compression
    toDataURL(canvas, quality = this.defaults.imageQuality) {
        return canvas.toDataURL('image/jpeg', quality);
    }

    toBlob(canvas, quality = this.defaults.imageQuality) {
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                quality
            );
        });
    }

    // Merge multiple canvases
    mergeCanvases(canvases, options = {}) {
        const {
            width = Math.max(...canvases.map(c => c.width)),
            height = Math.max(...canvases.map(c => c.height)),
            blendMode = 'source-over'
        } = options;

        const mergedCanvas = this.createCanvas(width, height);
        const ctx = mergedCanvas.getContext('2d');

        canvases.forEach(canvas => {
            ctx.save();
            ctx.globalCompositeOperation = blendMode;
            ctx.drawImage(canvas, 0, 0, width, height);
            ctx.restore();
        });

        return mergedCanvas;
    }

    // Create grid pattern
    createGridPattern(width, height, cellSize, color = 'rgba(255, 255, 255, 0.3)') {
        const canvas = this.createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= width; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        return canvas;
    }
}

export default CanvasUtils;