// PWA installation and update management
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
    }

    init() {
        this.setupBeforeInstallPrompt();
        this.setupAppInstalled();
        this.setupServiceWorkerUpdate();
    }

    setupBeforeInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            // Show custom install promotion if needed
            this.showInstallPromotion();
        });
    }

    setupAppInstalled() {
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
            this.hideInstallPromotion();
            
            // Show welcome message
            this.showToast('Composition Camera installed successfully!');
        });
    }

    setupServiceWorkerUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt variable
        this.deferredPrompt = null;
    }

    showInstallPromotion() {
        // You could show a custom install button here
        console.log('PWA install available');
    }

    hideInstallPromotion() {
        // Hide your custom install button if shown
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    checkStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
}

export function initPWA() {
    const pwa