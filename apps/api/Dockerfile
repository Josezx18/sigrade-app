FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json prisma.config.ts ./
COPY apps/api/ apps/api/
COPY prisma/ prisma/
COPY libs/ libs/

RUN npm ci
RUN npx prisma generate --schema=prisma/schema.prisma
RUN NX_DAEMON=false npx nx build api

FROM node:22-bookworm-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist/apps/api ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

COPY <<EOF /app/start.sh
#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "Starting API server..."
exec node dist/main.js
EOF

RUN chmod +x /app/start.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD node -e "fetch('http://localhost:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["/app/start.sh"]
