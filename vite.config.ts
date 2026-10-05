import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vitest の設定を含む拡張型
interface ViteConfigWithTest extends UserConfig {
  test?: {
    environment?: string;
    include?: string[];
  };
}

const config: ViteConfigWithTest = {
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
};

// https://vite.dev/config/
export default defineConfig(config);
