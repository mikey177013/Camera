class Vibration {
    constructor() {
        this.supported = 'vibrate' in navigator;
        this.enabled = true;
        this.intensity = 1.0; // 0.0 to 1.0
    }

    init() {
        // Check user preferences for vibration
        if ('mediaSession' in navigator) {
            // Check if vibration is allowed
            // This is a simple check - in production, you might want more sophisticated checks
            this.enabled = !this.isDoNotDisturb();
        }
        
        console.log(`Vibration ${this.supported ? 'supported' : 'not supported'} and ${this.enabled ? 'enabled' : 'disabled'}`);
    }

    vibrate(pattern) {
        if (!this.supported || !this.enabled) return;
        
        try {
            // Apply intensity to pattern
            let adjustedPattern;
            if (Array.isArray(pattern)) {
                adjustedPattern = pattern.map((value, index) => {
                    // Only adjust vibration durations (even indices)
                    return index % 2 === 0 ? Math.round(value * this.intensity) : value;
                });
            } else {
                adjustedPattern = Math.round(pattern * this.intensity);
            }
            
            navigator.vibrate(adjustedPattern);
        } catch (error) {
            console.warn('Vibration failed:', error);
        }
    }

    // Common vibration patterns
    patterns = {
        shutter: 50,
        buttonPress: 30,
        error: [100, 50, 100],
        success: [30, 50, 30],
        alert: [200, 100, 200, 100, 200]
    };

    shutter() {
        this.vibrate(this.patterns.shutter);
    }

    buttonPress() {
        this.vibrate(this.patterns.buttonPress);
    }

    error() {
        this.vibrate(this.patterns.error);
    }

    success() {
        this.vibrate(this.patterns.success);
    }

    alert() {
        this.vibrate(this.patterns.alert);
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        // Cancel any ongoing vibration
        this.cancel();
    }

    cancel() {
        if (this.supported) {
            navigator.vibrate(0);
        }
    }

    isDoNotDisturb() {
        // This is a simplified check
        // In a real app, you'd want to check actual device settings
        if ('userAgentData' in navigator) {
            const uaData = navigator.userAgentData;
            // Some devices/browsers might indicate DnD mode
            return false; // Default to false as we can't accurately detect
        }
        return false;
    }

    isSupported() {
        return this.supported;
    }

    isEnabled() {
        return this.supported && this.enabled;
    }
}

export default Vibration;