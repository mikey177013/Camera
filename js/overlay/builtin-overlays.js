class BuiltinOverlays {
    constructor() {
        this.overlays = [];
        this.builtinOverlays = [
            {
                id: 'none',
                name: 'None',
                type: 'builtin',
                created: '2024-01-01'
            },
            {
                id: 'rule_of_thirds',
                name: 'Rule of Thirds',
                type: 'builtin',
                created: '2024-01-01'
            }
        ];
    }

    async init() {
        await this.generateBuiltinOverlays();
    }

    async generateBuiltinOverlays() {
        // Create rule of thirds overlay
        const ruleOfThirds = await this.createRuleOfThirdsOverlay();
        
        this.overlays = [
            {
                id: 'none',
                name: 'None',
                type: 'builtin',
                created: '2024-01-01',
                data: null
            },
            {
                id: 'rule_of_thirds',
                name: 'Rule of Thirds',
                type: 'builtin',
                created: '2024-01-01',
                data: ruleOfThirds
            }
        ];
    }

    async createRuleOfThirdsOverlay() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 1000;
            const ctx = canvas.getContext('2d');
            
            // Set line style
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            // Draw vertical lines (at 1/3 and 2/3)
            ctx.beginPath();
            ctx.moveTo(canvas.width / 3, 0);
            ctx.lineTo(canvas.width / 3, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(canvas.width * 2 / 3, 0);
            ctx.lineTo(canvas.width * 2 / 3, canvas.height);
            ctx.stroke();
            
            // Draw horizontal lines (at 1/3 and 2/3)
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 3);
            ctx.lineTo(canvas.width, canvas.height / 3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * 2 / 3);
            ctx.lineTo(canvas.width, canvas.height * 2 / 3);
            ctx.stroke();
            
            // Draw intersection points
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(canvas.width / 3, canvas.height / 3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(canvas.width * 2 / 3, canvas.height / 3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(canvas.width / 3, canvas.height * 2 / 3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(canvas.width * 2 / 3, canvas.height * 2 / 3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            resolve(canvas);
        });
    }

    getOverlays() {
        return this.overlays;
    }

    getOverlay(id) {
        return this.overlays.find(overlay => overlay.id === id);
    }

    isBuiltin(overlayId) {
        return this.builtinOverlays.some(overlay => overlay.id === overlayId);
    }
}

export default BuiltinOverlays;