class SafeArea {
    constructor() {
        this.insets = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
        
        this.cssVariables = {
            top: '--safe-area-inset-top',
            right: '--safe-area-inset-right',
            bottom: '--safe-area-inset-bottom',
            left: '--safe-area-inset-left'
        };
    }

    init() {
        this.calculateInsets();
        this.applyCSSVariables();
        this.setupEventListeners();
    }

    calculateInsets() {
        // Default values for non-notch devices
        this.insets = {
            top: this.calculateTopInset(),
            right: this.calculateRightInset(),
            bottom: this.calculateBottomInset(),
            left: this.calculateLeftInset()
        };

        console.log('Safe area insets calculated:', this.insets);
    }

    calculateTopInset() {
        // iOS with notch (iPhone X and later)
        if (this.isIOSWithNotch()) {
            return 44; // iPhone notch height
        }
        
        // Android with notch/status bar
        if (this.isAndroidWithNotch()) {
            return 24; // Typical Android status bar height
        }
        
        return 0;
    }

    calculateBottomInset() {
        // iOS with home indicator (iPhone X and later)
        if (this.isIOSWithNotch()) {
            return 34; // Home indicator height
        }
        
        // Android with navigation bar
        if (this.isAndroidWithNavigationBar()) {
            return 48; // Typical Android navigation bar height
        }
        
        return 0;
    }

    calculateLeftInset() {
        // Landscape mode with notch on the left
        if (this.isLandscapeWithLeftNotch()) {
            return 44; // iPhone notch width in landscape
        }
        
        return 0;
    }

    calculateRightInset() {
        // Landscape mode with notch on the right
        if (this.isLandscapeWithRightNotch()) {
            return 44; // iPhone notch width in landscape
        }
        
        return 0;
    }

    isIOSWithNotch() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        
        if (!isIOS) return false;
        
        // Check for iPhone X and later (screen height >= 812)
        const screenHeight = Math.max(window.screen.height, window.screen.width);
        return screenHeight >= 812;
    }

    isAndroidWithNotch() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = /android/.test(userAgent);
        
        if (!isAndroid) return false;
        
        // Simple check for tall aspect ratio devices
        const aspectRatio = window.screen.height / window.screen.width;
        return aspectRatio > 2;
    }

    isAndroidWithNavigationBar() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = /android/.test(userAgent);
        
        if (!isAndroid) return false;
        
        // Check if device has soft navigation bar
        const viewportHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        const hasNavigationBar = viewportHeight < screenHeight;
        
        return hasNavigationBar;
    }

    isLandscapeWithLeftNotch() {
        if (!this.isIOSWithNotch()) return false;
        
        const isLandscape = window.innerWidth > window.innerHeight;
        const isLandscapeLeft = screen.orientation 
            ? screen.orientation.type.includes('landscape-secondary')
            : window.orientation === -90;
        
        return isLandscape && isLandscapeLeft;
    }

    isLandscapeWithRightNotch() {
        if (!this.isIOSWithNotch()) return false;
        
        const isLandscape = window.innerWidth > window.innerHeight;
        const isLandscapeRight = screen.orientation 
            ? screen.orientation.type.includes('landscape-primary')
            : window.orientation === 90;
        
        return isLandscape && isLandscapeRight;
    }

    applyCSSVariables() {
        const root = document.documentElement;
        
        // Apply CSS variables
        Object.entries(this.cssVariables).forEach(([key, variable]) => {
            root.style.setProperty(variable, `${this.insets[key]}px`);
        });
        
        // Apply environment variables for iOS
        root.style.setProperty('--env-safe-area-inset-top', `env(safe-area-inset-top, ${this.insets.top}px)`);
        root.style.setProperty('--env-safe-area-inset-right', `env(safe-area-inset-right, ${this.insets.right}px)`);
        root.style.setProperty('--env-safe-area-inset-bottom', `env(safe-area-inset-bottom, ${this.insets.bottom}px)`);
        root.style.setProperty('--env-safe-area-inset-left', `env(safe-area-inset-left, ${this.insets.left}px)`);
    }

    setupEventListeners() {
        // Update on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.calculateInsets();
                this.applyCSSVariables();
            }, 300); // Wait for orientation change to complete
        });
        
        // Update on resize (for desktop or responsive testing)
        window.addEventListener('resize', () => {
            this.calculateInsets();
            this.applyCSSVariables();
        });
    }

    getInsets() {
        return { ...this.insets };
    }

    getTopInset() {
        return this.insets.top;
    }

    getBottomInset() {
        return this.insets.bottom;
    }

    getLeftInset() {
        return this.insets.left;
    }

    getRightInset() {
        return this.insets.right;
    }

    // Utility functions for applying safe area to elements
    applyToElement(element, sides = ['top', 'right', 'bottom', 'left']) {
        if (!element) return;
        
        sides.forEach(side => {
            const inset = this.insets[side];
            if (inset > 0) {
                const style = element.style;
                
                switch (side) {
                    case 'top':
                        style.paddingTop = `calc(${style.paddingTop || '0px'} + ${inset}px)`;
                        break;
                    case 'right':
                        style.paddingRight = `calc(${style.paddingRight || '0px'} + ${inset}px)`;
                        break;
                    case 'bottom':
                        style.paddingBottom = `calc(${style.paddingBottom || '0px'} + ${inset}px)`;
                        break;
                    case 'left':
                        style.paddingLeft = `calc(${style.paddingLeft || '0px'} + ${inset}px)`;
                        break;
                }
            }
        });
    }

    applyToClass(className, sides = ['top', 'right', 'bottom', 'left']) {
        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(element => {
            this.applyToElement(element, sides);
        });
    }

    // Check if device has any safe area insets
    hasSafeArea() {
        return Object.values(this.insets).some(inset => inset > 0);
    }

    // Get CSS for safe area classes
    getSafeAreaCSS() {
        return `
            .safe-area-top {
                padding-top: env(safe-area-inset-top, var(--safe-area-inset-top, 0));
            }
            .safe-area-right {
                padding-right: env(safe-area-inset-right, var(--safe-area-inset-right, 0));
            }
            .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0));
            }
            .safe-area-left {
                padding-left: env(safe-area-inset-left, var(--safe-area-inset-left, 0));
            }
            .safe-area-horizontal {
                padding-left: env(safe-area-inset-left, var(--safe-area-inset-left, 0));
                padding-right: env(safe-area-inset-right, var(--safe-area-inset-right, 0));
            }
            .safe-area-vertical {
                padding-top: env(safe-area-inset-top, var(--safe-area-inset-top, 0));
                padding-bottom: env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0));
            }
            .safe-area-all {
                padding: env(safe-area-inset-top, var(--safe-area-inset-top, 0))
                         env(safe-area-inset-right, var(--safe-area-inset-right, 0))
                         env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0))
                         env(safe-area-inset-left, var(--safe-area-inset-left, 0));
            }
        `;
    }
}

export default SafeArea;