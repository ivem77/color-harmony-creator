class ColorPaletteGenerator {
    constructor() {
        this.initElements();
        this.initColorWheel();
        this.initEventListeners();
        this.activeHarmony = 'analogous';
        this.updatePalette();
        
        // Initialize theme from localStorage or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    initElements() {
        this.paletteDisplay = document.querySelector('.palette-display');
        this.harmonyButtons = document.querySelectorAll('.harmony-btn');
        this.saturationSlider = document.getElementById('saturationSlider');
        this.lightnessSlider = document.getElementById('lightnessSlider');
        this.saturationValue = document.getElementById('saturationValue');
        this.lightnessValue = document.getElementById('lightnessValue');
        this.themeToggle = document.querySelector('.theme-toggle');
    }

    initColorWheel() {
        this.colorWheel = new ColorWheel(document.getElementById('colorWheel'), {
            onColorChange: (color) => {
                this.updatePalette();
                this.updateSliderValues(color);
            }
        });
    }

    initEventListeners() {
        this.saturationSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.saturationValue.textContent = `${value}%`;
            this.colorWheel.updateSL(value, parseInt(this.lightnessSlider.value));
        });

        this.lightnessSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.lightnessValue.textContent = `${value}%`;
            this.colorWheel.updateSL(parseInt(this.saturationSlider.value), value);
        });

        this.harmonyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update button states
                this.harmonyButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active harmony
                this.activeHarmony = button.dataset.harmony;
                
                // Update description visibility
                document.querySelectorAll('.harmony-description .description').forEach(desc => {
                    desc.classList.remove('active');
                });
                document.querySelector(`.harmony-description .description.${this.activeHarmony}`).classList.add('active');
                
                // Update palette
                this.updatePalette();
            });
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Redraw the color wheel to update dashed lines
            this.colorWheel.draw();
            this.colorWheel.drawHarmonyDots(this.activeHarmony);
        });
    }

    updateSliderValues(color) {
        this.saturationSlider.value = color.s;
        this.lightnessSlider.value = color.l;
        this.saturationValue.textContent = `${color.s}%`;
        this.lightnessValue.textContent = `${color.l}%`;
    }

    updatePalette() {
        const color = this.colorWheel.getColor();
        const colors = ColorUtils.getHarmonyColors(
            color.h,
            color.s,
            color.l,
            this.activeHarmony
        );

        // Draw harmony dots on the wheel
        this.colorWheel.draw();
        this.colorWheel.drawHarmonyDots(this.activeHarmony);

        // Update palette display
        this.paletteDisplay.innerHTML = colors.map(([h, s, l]) => {
            const [r, g, b] = ColorUtils.hslToRgb(h, s, l);
            const hex = ColorUtils.rgbToHex(r, g, b);
            const hslColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
            
            return `
                <div class="color-swatch">
                    <div class="swatch-preview" style="background-color: ${hslColor}"></div>
                    <div class="swatch-info">
                        <div class="color-value" data-value="${hex}">
                            HEX<span>${hex}</span>
                        </div>
                        <div class="color-value" data-value="rgb(${r}, ${g}, ${b})">
                            RGB<span>rgb(${r}, ${g}, ${b})</span>
                        </div>
                        <div class="color-value" data-value="${hslColor}">
                            HSL<span>hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.setupCopyHandlers();
    }

    setupCopyHandlers() {
        document.querySelectorAll('.color-value').forEach(el => {
            el.addEventListener('click', () => {
                navigator.clipboard.writeText(el.dataset.value);
                this.showCopiedTooltip(el);
            });
        });
    }

    showCopiedTooltip(element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'copied-tooltip';
        tooltip.textContent = 'copied';
        element.appendChild(tooltip);
        
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });
        
        setTimeout(() => {
            tooltip.remove();
        }, 1000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ColorPaletteGenerator();
}); 