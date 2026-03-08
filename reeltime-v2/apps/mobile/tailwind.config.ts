// NativeWind is configured but not yet used - all screens currently use StyleSheet.create.
// This config is ready for future migration to className-based styling.
import type { Config } from 'tailwindcss';
import nativewindPreset from 'nativewind/preset';

const vintagePreset = require('@reeltime/config/tailwind/preset');

const config: Config = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [nativewindPreset, vintagePreset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
