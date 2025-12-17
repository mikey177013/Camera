class CameraSwitch {
    constructor() {
        this.currentCamera = 'environment';
        this.cameras = [];
        this.isSwitching = false;
    }

    init() {
        this.setupButton();
        this.enumerateCameras();
    }

    setupButton() {
        const switchButton = document.getElementById('switch-camera-button');
        if (switchButton) {
            switchButton.addEventListener('click', () => {
                this.switchCamera();
            });
        }
    }

    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            console.log(`Found ${this.cameras.length} cameras`);
        } catch (error) {
            console.error('Failed to enumerate cameras:', error);
        }
    }

    async switchCamera() {
        if (this.isSwitching) return;
        
        this.isSwitching = true;
        
        try {
            const event = new CustomEvent('cameraSwitch');
            document.dispatchEvent(event);
            
            // Update button state
            const switchButton = document.getElementById('switch-camera-button');
            if (switchButton) {
                switchButton.classList.add('button-press');
                setTimeout(() => {
                    switchButton.classList.remove('button-press');
                }, 200);
            }
        } catch (error) {
            console.error('Camera switch failed:', error);
        } finally {
            this.isSwitching = false;
        }
    }

    getCurrentCamera() {
        return this.currentCamera;
    }

    getAvailableCameras() {
        return this.cameras;
    }
}

export default CameraSwitch;