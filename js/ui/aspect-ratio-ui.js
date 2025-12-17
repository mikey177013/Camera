class AspectRatioUI {
    constructor() {
        this.buttons = document.querySelectorAll('.aspect-ratio-btn');
        this.currentRatio = '4:3';
    }

    init() {
        this.setupEventListeners();
        this.setActiveButton('4:3');
    }

    setupEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', () => {
                const ratio = button.dataset.ratio;
                this.setAspectRatio(ratio);
            });
            
            // Touch feedback
            button.addEventListener('touchstart', () => {
                button.classList.add('active-touch');
            });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('active-touch');
            });
        });
    }

    setAspectRatio(ratio) {
        if (this.currentRatio === ratio) return;
        
        this.currentRatio = ratio;
        this.setActiveButton(ratio);
        
        // Dispatch event
        const event = new CustomEvent('aspectRatioChanged', {
            detail: { ratio }
        });
        document.dispatchEvent(event);
        
        console.log(`Aspect ratio changed to ${ratio}`);
    }

    setActiveButton(ratio) {
        this.buttons.forEach(button => {
            if (button.dataset.ratio === ratio) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    getCurrentRatio() {
        return this.currentRatio;
    }

    getRatios() {
        return Array.from(this.buttons).map(btn => btn.dataset.ratio);
    }

    updateButtonLayout(orientation) {
        const selector = document.querySelector('.aspect-ratio-selector');
        if (!selector) return;
        
        if (orientation === 'landscape') {
            selector.style.flexDirection = 'column';
            this.buttons.forEach(btn => {
                btn.style.writingMode = 'vertical-rl';
                btn.style.textOrientation = 'mixed';
            });
        } else {
            selector.style.flexDirection = 'row';
            this.buttons.forEach(btn => {
                btn.style.writingMode = 'horizontal-tb';
                btn.style.textOrientation = 'mixed';
            });
        }
    }
}

export default AspectRatioUI;