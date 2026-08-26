# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY design-system design-system
COPY newsplus-API newsplus-API
COPY newsplus-front newsplus-front

# Work around npm optional-deps bug for lightningcss native bindings (Linux CI/Docker)
RUN rm -rf node_modules package-lock.json && \
    npm install --workspaces --include-workspace-root --no-audit --no-fund && \
    node -e "require('lightningcss-linux-x64-gnu'); console.log('lightningcss binding ok')"

RUN npm run build -w newsplus-API && npm run build -w newsplus-front

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY newsplus-API/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/newsplus-API/dist ./dist
COPY --from=builder /app/newsplus-API/server.cjs ./
COPY --from=builder /app/newsplus-front/dist ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.cjs"]
