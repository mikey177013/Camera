class OverlayScaling {
    calculateScale(overlayWidth, overlayHeight, targetWidth, targetHeight, aspectRatio = '4:3') {
        // Parse aspect ratio
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const targetRatio = ratioW / ratioH;
        
        // Calculate target dimensions based on aspect ratio
        let containerWidth, containerHeight;
        const containerRatio = targetWidth / targetHeight;
        
        if (containerRatio > targetRatio) {
            // Container is wider than target ratio
            containerHeight = targetHeight;
            containerWidth = containerHeight * targetRatio;
        } else {
            // Container is taller than target ratio
            containerWidth = targetWidth;
            containerHeight = containerWidth / targetRatio;
        }
        
        // Calculate offset to center the cropped area
        const offsetX = (targetWidth - containerWidth) / 2;
        const offsetY = (targetHeight - containerHeight) / 2;
        
        // Calculate scale to fit overlay into container
        const overlayAspect = overlayWidth / overlayHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let scale, drawWidth, drawHeight, drawX, drawY;
        
        if (containerAspect > overlayAspect) {
            // Container is wider than overlay
            scale = containerHeight / overlayHeight;
            drawHeight = containerHeight;
            drawWidth = overlayWidth * scale;
            drawX = offsetX + (containerWidth - drawWidth) / 2;
            drawY = offsetY;
        } else {
            // Container is taller than overlay
            scale = containerWidth / overlayWidth;
            drawWidth = containerWidth;
            drawHeight = overlayHeight * scale;
            drawX = offsetX;
            drawY = offsetY + (containerHeight - drawHeight) / 2;
        }
        
        return {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
            scale,
            offsetX,
            offsetY,
            containerWidth,
            containerHeight
        };
    }

    calculateCenterFit(overlayWidth, overlayHeight, containerWidth, containerHeight) {
        const overlayAspect = overlayWidth / overlayHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let width, height, x, y;
        
        if (containerAspect > overlayAspect) {
            // Container is wider than overlay
            height = containerHeight;
            width = height * overlayAspect;
            x = (containerWidth - width) / 2;
            y = 0;
        } else {
            // Container is taller than overlay
            width = containerWidth;
            height = width / overlayAspect;
            x = 0;
            y = (containerHeight - height) / 2;
        }
        
        return { x, y, width, height };
    }

    calculateCenterCrop(overlayWidth, overlayHeight, containerWidth, containerHeight) {
        const overlayAspect = overlayWidth / overlayHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let width, height, x, y;
        
        if (containerAspect > overlayAspect) {
            // Container is wider than overlay - crop height
            width = containerWidth;
            height = width / overlayAspect;
            x = 0;
            y = (containerHeight - height) / 2;
        } else {
            // Container is taller than overlay - crop width
            height = containerHeight;
            width = height * overlayAspect;
            x = (containerWidth - width) / 2;
            y = 0;
        }
        
        return { x, y, width, height };
    }

    getAspectRatioDimensions(ratio) {
        const ratios = {
            '1:1': { width: 1, height: 1 },
            '4:3': { width: 4, height: 3 },
            '16:9': { width: 16, height: 9 }
        };
        
        return ratios[ratio] || ratios['4:3'];
    }

    isValidAspectRatio(ratio) {
        const validRatios = ['1:1', '4:3', '16:9'];
        return validRatios.includes(ratio);
    }
}

export default OverlayScaling;