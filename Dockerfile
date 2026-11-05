# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY design-system design-system
COPY newsplus-API newsplus-API
COPY newsplus-front newsplus-front

# Reproducible workspace install (keep package-lock.json). Optional native binding for lightningcss (Vite) on Linux.
RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund && \
    npm install lightningcss-linux-x64-gnu@1.33.0 -w newsplus-front --no-audit --no-fund && \
    node -e "require('lightningcss-linux-x64-gnu'); console.log('lightningcss binding ok')"

RUN npm run build -w @newsplus/shared && npm run build -w newsplus-API
RUN if [ ! -f newsplus-front/dist/index.html ]; then npm run build -w newsplus-front; else echo "Using prebuilt newsplus-front/dist"; fi

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_OPTIONS=--experimental-sqlite

# The API imports runtime values from @newsplus/shared, a `file:../packages/shared` link that lands on
# /packages/shared here. Ship its compiled JS there, exported as JS (the workspace package exports its TS source).
COPY --from=builder /app/packages/shared/dist /packages/shared/dist
RUN echo '{"name":"@newsplus/shared","version":"0.1.0","private":true,"type":"module","exports":{".":"./dist/index.js"}}' > /packages/shared/package.json

COPY newsplus-API/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/newsplus-API/dist ./dist
COPY --from=builder /app/newsplus-API/assets ./assets
COPY --from=builder /app/newsplus-API/server.cjs ./
COPY --from=builder /app/newsplus-front/dist ./public

# Fail the build, not the deploy, if a runtime import doesn't resolve (the running container stays up).
RUN NODE_ENV=development node --input-type=module -e "await import('./dist/app.js')"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.cjs"]
