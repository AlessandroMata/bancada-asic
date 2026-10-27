#!/bin/sh
# © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
set -e
mkdir -p /data/home /data/logs
cd /app
# migrações são idempotentes: só aplica o que falta
node_modules/.bin/wrangler d1 migrations apply DB --local --persist-to /data --config dist/server/wrangler.docker.json
exec node_modules/.bin/wrangler dev --config dist/server/wrangler.docker.json --local --persist-to /data --ip 0.0.0.0 --port 8787 --inspector-port 0
