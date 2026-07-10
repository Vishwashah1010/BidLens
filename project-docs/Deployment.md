# Deployment Specifications - Kaya SmartProcure

- **Runtime Target**: Cloud Run.
- **Port Ingress**: Maps externally exclusively on Port `3000`.
- **Bundler Configuration**: `esbuild` bundles TypeScript backend server files into a single CommonJS module (`dist/server.cjs`) for maximum startup performance.
- **Static Assets**: Compiled frontend code is written to `/dist` and served statically by Express in production mode.
