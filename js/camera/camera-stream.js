class CameraStream {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };
    }

    async init(videoElement) {
        this.videoElement = videoElement;
        
        try {
            await this.startStream(this.constraints);
            console.log('Camera stream initialized');
        } catch (error) {
            console.error('Camera stream initialization failed:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    async startStream(constraints) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            // Play the video
            await this.videoElement.play();
            
            return this.stream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw error;
        }
    }

    async switchCamera(facingMode) {
        if (this.stream) {
            this.stop();
        }
        
        const newConstraints = {
            ...this.constraints,
            video: {
                ...this.constraints.video,
                facingMode: facingMode
            }
        };
        
        try {
            await this.startStream(newConstraints);
            console.log(`Switched to ${facingMode} camera`);
        } catch (error) {
            console.error('Failed to switch camera:', error);
            throw error;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    getStream() {
        return this.stream;
    }

    getVideoSettings() {
        if (!this.stream) return null;
        
        const videoTrack = this.stream.getVideoTracks()[0];
        return videoTrack.getSettings();
    }

    isStreaming() {
        return this.stream && this.stream.active;
    }
}

export default CameraStream;