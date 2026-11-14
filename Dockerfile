# syntax=docker/dockerfile:1.7

# ── 1. Dependencies (cached until package*.json changes) ─────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── 2. Build ─────────────────────────────────────────────────────────────────
# VITE_* values are read from .env.production, which Vite loads automatically
# for a production build. They are inlined into the JS bundle (public values;
# never put secrets here).
FROM deps AS build
COPY . .
# Fail the build rather than ship a bundle that calls the wrong host.
RUN test -f .env.production \
    && grep -qE '^VITE_API_BASE_URL=.+' .env.production \
    && grep -qE '^VITE_API_BASE_WS_URL=.+' .env.production
RUN NODE_ENV=production npm run build \
 # Pre-compress once so nginx serves .gz files (gzip_static) with zero CPU cost.
 && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \
        -o -name '*.svg' -o -name '*.json' -o -name '*.txt' -o -name '*.xml' \) \
        -exec gzip -9 -k -f {} +

# ── 3. Runtime: tiny, non-root static server ─────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
