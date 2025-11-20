#!/bin/sh

set -e

DB_HOST="${PGHOST:-db}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"

echo "[wait] Checking database availability at ${DB_HOST}:${DB_PORT}..."

# Проверяем не только порт, но и возможность подключения
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "[ok] Database is ready"

MINIO_HOST="${MINIO_ENDPOINT:-minio}"
MINIO_PORT="${MINIO_PORT:-9000}"

echo "[wait] Checking MinIO availability at ${MINIO_HOST}:${MINIO_PORT}..."

# Проверяем MinIO API endpoint
until curl -f "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live"; do
  echo "MinIO is unavailable - sleeping"
  sleep 2
done

echo "[ok] MinIO is ready"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

echo "[wait] Checking Redis availability at ${REDIS_HOST}:${REDIS_PORT}..."

# Проверяем Redis endpoint
until redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done

echo "[ok] Redis is ready"

echo "[run] Applying migrations..."
npx node-pg-migrate up || echo "Migrations failed or already applied"

echo "[run] Starting server..."
exec npm start
