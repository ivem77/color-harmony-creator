class ColorUtils {
    static rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return [
            Math.round(h * 360),
            Math.round(s * 100),
            Math.round(l * 100)
        ];
    }

    static hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }

    static rgbToHex(r, g, b) {
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    static getHarmonyAngles(type) {
        switch (type) {
            case 'analogous':
                return [-30, 0, 30];
            case 'complementary':
                return [0, 180];
            case 'triadic':
                return [0, 120, 240];
            case 'split-complementary':
                return [0, 150, 210];
            case 'tetradic':
                return [0, 90, 180, 270];  // Rectangle/double complementary
            case 'monochromatic':
                return [0];
            default:
                return [0];
        }
    }

    static getHarmonyColors(hue, saturation, lightness, type) {
        const angles = this.getHarmonyAngles(type);
        
        if (type === 'monochromatic') {
            return [
                [hue, saturation, lightness],
                [hue, saturation, Math.max(20, lightness - 30)],
                [hue, Math.max(20, saturation - 30), lightness],
                [hue, saturation, Math.min(80, lightness + 30)],
                [hue, Math.min(100, saturation + 30), lightness]
            ];
        }

        return angles.map(angle => {
            let h = (hue + angle) % 360;
            if (h < 0) h += 360;
            return [h, saturation, lightness];
        });
    }
} 