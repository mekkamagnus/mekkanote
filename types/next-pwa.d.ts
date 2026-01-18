declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  export function withPWA(config: NextConfig): NextConfig;
}