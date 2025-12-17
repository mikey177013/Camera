class ShutterButton {
    constructor() {
        this.button = document.getElementById('shutter-button');
        this.cameraController = null;
        this.isProcessing = false;
    }

    init() {
        this.setupEventListeners();
    }

    setCameraController(cameraController) {
        this.cameraController = cameraController;
    }

    setupEventListeners() {
        if (!this.button) return;
        
        // Click event
        this.button.addEventListener('click', () => {
            this.handleCapture();
        });
        
        // Touch events for better mobile experience
        this.button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.button.classList.add('active');
        });
        
        this.button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.button.classList.remove('active');
            this.handleCapture();
        });
    }

    async handleCapture() {
        if (this.isProcessing || !this.cameraController) return;
        
        this.isProcessing = true;
        this.button.classList.add('processing');
        
        try {
            await this.cameraController.capturePhoto();
        } catch (error) {
            console.error('Capture failed:', error);
        } finally {
            this.isProcessing = false;
            this.button.classList.remove('processing');
        }
    }

    setProcessing(state) {
        this.isProcessing = state;
        if (state) {
            this.button.classList.add('processing');
        } else {
            this.button.classList.remove('processing');
        }
    }

    getButton() {
        return this.button;
    }
}

export default ShutterButton;