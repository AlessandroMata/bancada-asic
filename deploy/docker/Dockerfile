# © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
# Runtime local da Cloudflare (workerd) com banco D1 em SQLite e fotos em disco, num único container por cliente.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 curl tini ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund wrangler@4.92.0 && npm cache clean --force
COPY dist ./dist
COPY drizzle ./drizzle
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data && chown -R node:node /app /data
ENV HOME=/data/home WRANGLER_SEND_METRICS=false CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_LOG_PATH=/data/logs NO_UPDATE_NOTIFIER=1
USER node
EXPOSE 8787
ENTRYPOINT ["/usr/bin/tini","--","/entrypoint.sh"]
