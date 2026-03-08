const preset = require('../preset');

describe('Tailwind preset - Design System Foundation', () => {
  const { theme } = preset;
  const { extend } = theme;

  describe('Dark mode configuration', () => {
    test('uses class strategy', () => {
      expect(preset.darkMode).toEqual(['class']);
    });
  });

  describe('Color tokens (AC #1)', () => {
    const { colors } = extend;

    test('defines all vintage cinema colors', () => {
      expect(colors['rouge-cinema']).toBe('#D32F2F');
      expect(colors['bordeaux-profond']).toBe('#B71C1C');
      expect(colors['or-antique']).toBe('#FFD54F');
      expect(colors['jaune-marquise']).toBe('#F9A825');
      expect(colors['creme-ecran']).toBe('#FFF8E1');
      expect(colors['beige-papier']).toBe('#EFEBE9');
      expect(colors['sepia-chaud']).toBe('#8D6E63');
      expect(colors['noir-velours']).toBe('#1A1A1A');
    });

    test('defines dark mode surface colors', () => {
      expect(colors.dark.primary).toBe('#EF5350');
      expect(colors.dark.surface).toBe('#2D2D2D');
      expect(colors.dark.background).toBe('#1A1A1A');
      expect(colors.dark.border).toBe('#5D4037');
      expect(colors.dark['text-primary']).toBe('#FFF8E1');
      expect(colors.dark['text-secondary']).toBe('#BCAAA4');
    });

    test('defines semantic colors with light/dark variants', () => {
      expect(colors.success).toEqual({ light: '#4CAF50', dark: '#66BB6A' });
      expect(colors.warning).toEqual({ light: '#FF9800', dark: '#FFA726' });
      expect(colors.error).toEqual({ light: '#F44336', dark: '#EF5350' });
      expect(colors.info).toEqual({ light: '#2196F3', dark: '#42A5F5' });
    });
  });

  describe('Font families (AC #1, #5)', () => {
    const { fontFamily } = extend;

    test('defines Bebas Neue', () => {
      expect(fontFamily.bebas).toEqual(['Bebas Neue', 'sans-serif']);
    });

    test('defines Playfair Display', () => {
      expect(fontFamily.playfair).toEqual(['Playfair Display', 'serif']);
    });

    test('defines Crimson Text', () => {
      expect(fontFamily.crimson).toEqual(['Crimson Text', 'serif']);
    });
  });

  describe('Typography scale (AC #5)', () => {
    const { fontSize } = extend;

    test('defines display size (32px, Bebas)', () => {
      expect(fontSize.display[0]).toBe('32px');
      expect(fontSize.display[1].fontWeight).toBe('400');
    });

    test('defines headline size (24px, Playfair)', () => {
      expect(fontSize.headline[0]).toBe('24px');
      expect(fontSize.headline[1].fontWeight).toBe('700');
    });

    test('defines title size (20px, Playfair)', () => {
      expect(fontSize.title[0]).toBe('20px');
      expect(fontSize.title[1].fontWeight).toBe('600');
    });

    test('defines subtitle size (16px, Crimson)', () => {
      expect(fontSize.subtitle[0]).toBe('16px');
      expect(fontSize.subtitle[1].fontWeight).toBe('600');
    });

    test('defines body size (14px, Crimson)', () => {
      expect(fontSize.body[0]).toBe('14px');
      expect(fontSize.body[1].fontWeight).toBe('400');
    });

    test('defines caption size (12px, Crimson)', () => {
      expect(fontSize.caption[0]).toBe('12px');
      expect(fontSize.caption[1].fontWeight).toBe('400');
    });

    test('defines label size (11px, Bebas)', () => {
      expect(fontSize.label[0]).toBe('11px');
      expect(fontSize.label[1].letterSpacing).toBe('0.05em');
      expect(fontSize.label[1].textTransform).toBe('uppercase');
    });

    test('all typography entries have lineHeight', () => {
      Object.entries(fontSize).forEach(([name, [size, opts]]) => {
        expect(opts.lineHeight).toBeDefined();
      });
    });
  });

  describe('Spacing scale (AC #1)', () => {
    const { spacing } = extend;

    test('defines 8px-based spacing scale', () => {
      expect(spacing['1']).toBe('4px');
      expect(spacing['2']).toBe('8px');
      expect(spacing['3']).toBe('12px');
      expect(spacing['4']).toBe('16px');
      expect(spacing['5']).toBe('24px');
      expect(spacing['6']).toBe('32px');
      expect(spacing['8']).toBe('48px');
    });
  });

  describe('Border radius (AC #1)', () => {
    const { borderRadius } = extend;

    test('defines all radius tokens', () => {
      expect(borderRadius.sm).toBe('4px');
      expect(borderRadius.DEFAULT).toBe('8px');
      expect(borderRadius.lg).toBe('12px');
      expect(borderRadius.xl).toBe('16px');
      expect(borderRadius.full).toBe('9999px');
      expect(borderRadius.ticket).toBe('8px');
    });
  });

  describe('Box shadows (AC #1)', () => {
    const { boxShadow } = extend;

    test('defines all shadow tokens', () => {
      expect(boxShadow.sm).toBeDefined();
      expect(boxShadow.DEFAULT).toBeDefined();
      expect(boxShadow.lg).toBeDefined();
      expect(boxShadow.vintage).toContain('inset');
    });
  });

  describe('Preset structure', () => {
    test('uses extend (not override) for theme tokens', () => {
      expect(theme.extend).toBeDefined();
      expect(theme.colors).toBeUndefined();
      expect(theme.fontFamily).toBeUndefined();
    });

    test('does not include content paths', () => {
      expect(preset.content).toBeUndefined();
    });
  });
});
