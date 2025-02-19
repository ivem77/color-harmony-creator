class ColorPaletteGenerator {
    constructor() {
        this.initElements();
        this.initState();
        this.initEventListeners();
        this.render();
    }

    initElements() {
        this.colorPicker = document.getElementById('colorPicker');
        this.cursor = this.colorPicker.querySelector('.color-picker-cursor');
        this.hueSlider = document.getElementById('hueSlider');
        this.paletteDisplay = document.querySelector('.palette-display');
        this.harmonyButtons = document.querySelectorAll('.harmony-btn');
        this.themeToggle = document.querySelector('.theme-toggle');
        this.colorWheel = document.getElementById('colorWheel');
        this.wheelCtx = this.colorWheel.getContext('2d');
        this.harmonyDots = document.querySelector('.harmony-dots');
    }

    initState() {
        // Convert initial RGB(28, 205, 150) to HSL
        const [h, s, l] = ColorUtils.rgbToHsl(28, 205, 150);
        this.currentHue = h;
        this.currentSaturation = s;
        this.currentLightness = l;
        
        // Set initial hue slider value
        this.hueSlider.value = h;
        
        // Set initial cursor position
        this.updateCursorPosition();
        
        this.activeHarmony = 'analogous';
        this.isDragging = false;
        this.updateColorPickerBackground();
        this.drawColorWheel();
    }

    initEventListeners() {
        // Color picker events
        this.colorPicker.addEventListener('mousedown', this.startDragging.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDragging.bind(this));
        
        // Hue slider events
        this.hueSlider.addEventListener('input', this.handleHueChange.bind(this));
        
        // Harmony selection
        this.harmonyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeHarmony = btn.dataset.harmony;
                this.updateActiveButton();
                this.updatePalette();
            });
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    startDragging(e) {
        this.isDragging = true;
        this.updateColorFromEvent(e);
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        this.updateColorFromEvent(e);
    }

    stopDragging() {
        this.isDragging = false;
    }

    handleHueChange(e) {
        this.currentHue = parseInt(e.target.value);
        this.updateColorPickerBackground();
        this.updateColorFromPosition();
    }

    updateColorFromEvent(e) {
        const rect = this.colorPicker.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        this.cursor.style.left = `${x * 100}%`;
        this.cursor.style.top = `${y * 100}%`;

        this.currentSaturation = x * 100;
        this.currentLightness = 100 - (y * 100);
        this.updateColorFromPosition();
    }

    updateColorFromPosition() {
        const [r, g, b] = ColorUtils.hslToRgb(
            this.currentHue,
            this.currentSaturation,
            this.currentLightness
        );
        
        this.drawColorWheel();
        this.updatePalette();
    }

    updateCursorPosition() {
        this.cursor.style.left = `${this.currentSaturation}%`;
        this.cursor.style.top = `${100 - this.currentLightness}%`;
    }

    updateColorPickerBackground() {
        const [r, g, b] = ColorUtils.hslToRgb(this.currentHue, 100, 50);
        const hueColor = `rgb(${r}, ${g}, ${b})`;
        
        this.colorPicker.style.background = `
            linear-gradient(to bottom, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 255, 255, 0) 50%,
                rgba(0, 0, 0, 1) 100%),
            linear-gradient(to right, 
                rgba(255, 255, 255, 1) 0%, 
                ${hueColor} 100%)
        `;
    }

    drawColorWheel() {
        const { width, height } = this.colorWheel;
        const ctx = this.wheelCtx;
        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = Math.min(width, height) / 2 - 5;
        const innerRadius = outerRadius - 12;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        ctx.globalAlpha = 0.15;

        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const adjustedAngle = (angle - 90 + 360) % 360;
            const startAngle = (adjustedAngle - 2) * Math.PI / 180;
            const endAngle = (adjustedAngle + 2) * Math.PI / 180;

            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(startAngle) * innerRadius, 
                      centerY + Math.sin(startAngle) * innerRadius);
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();

            const [r, g, b] = ColorUtils.hslToRgb(angle, this.currentSaturation, this.currentLightness);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    updateHarmonyDots() {
        const harmony = ColorUtils.getHarmony(
            this.currentHue,
            this.currentSaturation,
            this.currentLightness,
            this.activeHarmony
        );

        const outerRadius = this.colorWheel.width / 2 - 5;
        const innerRadius = outerRadius - 12;
        const radius = outerRadius - 6;

        const centerX = this.colorWheel.width / 2;
        const centerY = this.colorWheel.height / 2;

        // Update lines
        const lines = harmony.map(([h, s, l]) => {
            const angle = ((h - 90 + 360) % 360) * Math.PI / 180;
            const rotationDeg = (h - 90 + 360) % 360;
            return `
                <div class="harmony-line" 
                     style="width: ${radius}px; transform: rotate(${rotationDeg}deg)">
                </div>
            `;
        }).join('');
        this.harmonyDots.previousElementSibling.innerHTML = lines;

        // Update dots
        this.harmonyDots.innerHTML = harmony.map(([h, s, l]) => {
            const angle = ((h - 90 + 360) % 360) * Math.PI / 180;
            const distance = radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const [r, g, b] = ColorUtils.hslToRgb(h, this.currentSaturation, this.currentLightness);
            
            return `
                <div class="harmony-dot" 
                     style="left: ${x}px; top: ${y}px; background-color: rgb(${r}, ${g}, ${b})">
                </div>
            `;
        }).join('');
    }

    updatePalette() {
        const harmony = ColorUtils.getHarmony(
            this.currentHue,
            this.currentSaturation,
            this.currentLightness,
            this.activeHarmony
        );

        this.paletteDisplay.innerHTML = harmony.map(([h, s, l]) => {
            const [r, g, b] = ColorUtils.hslToRgb(h, s, l);
            const hex = ColorUtils.rgbToHex(r, g, b);
            
            return `
                <div class="color-swatch">
                    <div class="swatch-preview" style="background-color: ${hex}"></div>
                    <div class="swatch-info">
                        <div class="color-value" data-value="${hex}">HEX<span>${hex}</span></div>
                        <div class="color-value" data-value="rgb(${r}, ${g}, ${b})">RGB<span>rgb(${r},${g},${b})</span></div>
                        <div class="color-value" data-value="hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)">HSL<span>hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)</span></div>
                    </div>
                </div>
            `;
        }).join('');
        this.updateHarmonyDots();
        
        // Add click handlers for copying
        document.querySelectorAll('.color-value').forEach(el => {
            el.addEventListener('click', () => {
                navigator.clipboard.writeText(el.dataset.value);
                
                // Create and show tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'copied-tooltip';
                tooltip.textContent = 'copied';
                el.appendChild(tooltip);
                
                // Force reflow to trigger animation
                tooltip.offsetHeight;
                tooltip.classList.add('show');
                
                // Remove tooltip after animation
                setTimeout(() => {
                    tooltip.remove();
                }, 1000);
            });
        });
    }

    updateActiveButton() {
        this.harmonyButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.harmony === this.activeHarmony);
        });
        
        // Update description
        document.querySelectorAll('.harmony-description .description').forEach(desc => {
            desc.classList.toggle('active', desc.classList.contains(this.activeHarmony));
        });
    }

    toggleTheme() {
        document.body.dataset.theme = 
            document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    }

    render() {
        this.updateColorPickerBackground();
        this.updatePalette();
        this.updateActiveButton();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ColorPaletteGenerator();
}); 