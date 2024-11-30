import { defineConfig } from 'astro/config';

const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM);

import playformCompress from "@playform/compress";
import playformInline from "@playform/inline";

import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  server: {
    host: mobile ? "0.0.0.0" : false,
    port: 4321,
  },
  integrations: [playformInline(), playformCompress(), react(), tailwind()]
});