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
            // Get coordinates from either mouse or touch event
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Calculate distance from center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            // Only update if within the wheel radius
            if (distance <= this.radius) {
                // Calculate angle
                const angle = Math.atan2(y - centerY, x - centerX);
                this.selectedHue = ((angle * 180 / Math.PI) + 90) % 360;
                if (this.selectedHue < 0) this.selectedHue += 360;
                
                this.draw();
                this.options.onColorChange({
                    h: this.selectedHue,
                    s: this.saturation,
                    l: this.lightness
                });
            }
        };

        // Mouse events
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

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();  // Prevent scrolling
            updateColor(e);
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();  // Prevent scrolling
                updateColor(e);
            }
        });

        document.addEventListener('touchend', () => {
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