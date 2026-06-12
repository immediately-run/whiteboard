import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { devFs } from '@immediately-run/dev-fs'

// MDX must run before @vitejs/plugin-react so the JSX it emits is handled by
// React's transform (Fast Refresh included). immediately.run processes .mdx
// natively; this wiring keeps the local `vite dev`/`build` in sync.
//
// devFs() (@immediately-run/dev-fs) makes `import ... from 'fs'` work during
// local `vite dev`, bridging the same async ZenFS surface immediately.run
// provides to your real disk. It is dev-only and absent from production builds.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devFs(),
    { enforce: 'pre', ...mdx() },
    react(),
  ],
  // `fs` is host-provided at runtime (ZenFS in the sandbox, the devFs bridge under
  // `vite dev`). devFs is dev-only, so leave the bare specifier external in the
  // production build — immediately.run resolves it from its runtime, and the local
  // build stays a pure type/sanity check.
  build: {
    rollupOptions: { external: ['fs', 'node:fs'] },
  },
})
