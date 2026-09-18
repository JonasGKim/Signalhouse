import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';
const isVercel = process.env.DEPLOY_TARGET !== 'cloudflare';
const origin =
  process.env.SITE_URL ||
  (isVercel && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://signalhouse-research.bzpqyt5rvc.chatgpt.site');
export default defineConfig({
  site: origin,
  output: 'server',
  adapter: isVercel
    ? vercel({ maxDuration: 60 })
    : cloudflare({ imageService: 'passthrough' }),
  devToolbar: { enabled: false },
  trailingSlash: 'always',
});
