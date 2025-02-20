class ColorWheel {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Scale canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        
        this.radius = rect.width / 2;
        this.centerX = this.radius;
        this.centerY = this.radius;
        this.saturation = 100;
        this.lightness = 50;
        this.selectedHue = 0;
        this.options = {
            onColorChange: options.onColorChange || (() => {}),
        };

        this.draw();
        this.setupEventListeners();
    }

    draw(skipDots = false) {
        // Clear the entire canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Enable anti-aliasing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Draw color wheel with current saturation and lightness
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 2) * Math.PI / 180;
            const endAngle = (angle + 2) * Math.PI / 180;

            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();

            const hue = angle;
            // Apply current saturation and lightness to the wheel
            this.ctx.fillStyle = `hsl(${hue}, ${this.saturation}%, ${this.lightness}%)`;
            this.ctx.fill();
        }

        // Draw harmony dots if they exist and we're not skipping them
        if (this.harmonyType && !skipDots) {
            this.drawHarmonyDots(this.harmonyType);
        }
    }

    drawHarmonyDots(type) {
        // Store the current harmony type
        this.harmonyType = type;
        const angles = ColorUtils.getHarmonyAngles(type);

        // Clear and redraw the wheel without dots
        this.draw(true);  // Pass true to skip dots

        angles.forEach(angleOffset => {
            const hue = (this.selectedHue + angleOffset) % 360;
            const angle = hue * Math.PI / 180;
            const x = this.centerX + Math.cos(angle) * (this.radius * 0.8);
            const y = this.centerY + Math.sin(angle) * (this.radius * 0.8);

            // Draw dot shadow
            this.ctx.beginPath();
            this.ctx.arc(x, y, 17, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
            this.ctx.fill();

            // Draw main dot
            this.ctx.beginPath();
            this.ctx.arc(x, y, 16, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsl(${hue}, ${this.saturation}%, ${this.lightness}%)`;
            this.ctx.fill();
            
            // Draw white border with shadow
            this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
            this.ctx.shadowBlur = 4;
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            
            // Draw outer border
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }

    setupEventListeners() {
        let isDragging = false;

        const updateColor = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.centerX;
            const y = e.clientY - rect.top - this.centerY;
            
            // Calculate distance from center
            const distance = Math.sqrt(x * x + y * y);
            
            // Only update if click is within the wheel
            if (distance <= this.radius) {
                let angle = Math.atan2(y, x) * 180 / Math.PI;
                if (angle < 0) angle += 360;
                
                this.selectedHue = angle;
                this.draw();
                this.options.onColorChange({
                    h: this.selectedHue,
                    s: this.saturation,
                    l: this.lightness
                });
            }
        };

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateColor(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) updateColor(e);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('click', updateColor);
    }

    updateSL(saturation, lightness) {
        this.saturation = saturation;
        this.lightness = lightness;
        this.draw(); // This will redraw the wheel with new saturation and lightness
        this.options.onColorChange({
            h: this.selectedHue,
            s: this.saturation,
            l: this.lightness
        });
    }

    getColor() {
        return {
            h: this.selectedHue,
            s: this.saturation,
            l: this.lightness
        };
    }
} 