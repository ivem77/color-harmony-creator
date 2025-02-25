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

        // Make canvas focusable for keyboard navigation
        this.canvas.tabIndex = 0;
        this.canvas.setAttribute('role', 'application');
        this.canvas.setAttribute('aria-label', 'Color wheel. Use arrow keys to change hue.');

        this.draw();
        this.setupEventListeners();
        this.setupResizeHandler();
    }

    draw(skipDots = false) {
        // Clear the entire canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Enable anti-aliasing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        const innerRadius = this.radius * 0.75;  // Inner radius at 75% of outer radius
        
        // Draw color wheel with current saturation and lightness
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 2) * Math.PI / 180;
            const endAngle = (angle + 2) * Math.PI / 180;

            this.ctx.beginPath();
            // Draw outer arc
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            // Draw inner arc in counter-clockwise direction
            this.ctx.arc(this.centerX, this.centerY, innerRadius, endAngle, startAngle, true);
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

        // Get the current border color from CSS variable
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border');

        // Draw dashed lines first so they appear behind dots
        angles.forEach(angleOffset => {
            const hue = (this.selectedHue + angleOffset) % 360;
            const angle = hue * Math.PI / 180;
            const dotRadius = this.radius * 0.875;
            const x = this.centerX + Math.cos(angle) * dotRadius;
            const y = this.centerY + Math.sin(angle) * dotRadius;

            // Draw dashed line from center to dot
            this.ctx.beginPath();
            this.ctx.setLineDash([4, 4]);  // Create dashed line pattern
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x, y);
            this.ctx.strokeStyle = borderColor;  // Use border color from CSS variable
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.setLineDash([]);  // Reset to solid line
        });

        // Draw dots on top of the lines
        angles.forEach(angleOffset => {
            const hue = (this.selectedHue + angleOffset) % 360;
            const angle = hue * Math.PI / 180;
            const dotRadius = this.radius * 0.875;
            const x = this.centerX + Math.cos(angle) * dotRadius;
            const y = this.centerY + Math.sin(angle) * dotRadius;

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
        let isClickingDot = false;

        // Add keyboard event handling
        this.canvas.addEventListener('keydown', (e) => {
            // Arrow keys to change hue
            if (e.key === 'ArrowRight') {
                this.selectedHue = (this.selectedHue + 1) % 360;
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                this.selectedHue = (this.selectedHue - 1 + 360) % 360;
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                this.selectedHue = (this.selectedHue - 10 + 360) % 360;
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.selectedHue = (this.selectedHue + 10) % 360;
                e.preventDefault();
            }

            this.draw();
            this.options.onColorChange({
                h: this.selectedHue,
                s: this.saturation,
                l: this.lightness
            });
        });

        const updateColor = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Check if clicking on a dot
            const angles = ColorUtils.getHarmonyAngles(this.harmonyType);
            for (const angleOffset of angles) {
                const hue = (this.selectedHue + angleOffset) % 360;
                const angle = hue * Math.PI / 180;
                const dotRadius = this.radius * 0.875;
                const dotX = this.centerX + Math.cos(angle) * dotRadius;
                const dotY = this.centerY + Math.sin(angle) * dotRadius;
                
                const distToDot = Math.sqrt((x - dotX) ** 2 + (y - dotY) ** 2);
                if (distToDot <= 16) {
                    isClickingDot = true;
                    return;
                }
            }
            
            // Improved angle calculation
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            if (distance <= this.radius && !isClickingDot) {
                // Calculate angle in radians, then convert to degrees
                let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
                
                // Normalize angle to 0-360 range
                angle = (angle + 90) % 360;  // Rotate by 90 degrees so 0 is at the top
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

        // Mouse events with improved handling
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            isClickingDot = false;
            updateColor(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                isClickingDot = false;
                updateColor(e);
                e.preventDefault(); // Prevent unwanted selections while dragging
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            isClickingDot = false;
        });

        // Touch events with improved handling
        this.canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            isClickingDot = false;
            e.preventDefault();
            updateColor(e);
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                isClickingDot = false;
                e.preventDefault();
                updateColor(e);
            }
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
            isClickingDot = false;
        });

        // Single click handling
        this.canvas.addEventListener('click', (e) => {
            if (!isClickingDot) {
                updateColor(e);
            }
        });
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

    setupResizeHandler() {
        // Use ResizeObserver if available
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
            this.resizeObserver.observe(this.canvas);
        } else {
            // Fallback to window resize event
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimer);
                this.resizeTimer = setTimeout(() => this.handleResize(), 100);
            });
        }
    }

    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        
        this.radius = rect.width / 2;
        this.centerX = this.radius;
        this.centerY = this.radius;
        
        this.draw();
        if (this.harmonyType) {
            this.drawHarmonyDots(this.harmonyType);
        }
    }
} 