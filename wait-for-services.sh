#!/bin/sh

set -e

echo "[wait] Checking database availability..."

# Проверяем не только порт, но и возможность подключения
until pg_isready -h db -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "[ok] Database is ready"

echo "[wait] Checking MinIO availability..."

# Проверяем MinIO API endpoint
until curl -f http://minio:9000/minio/health/live; do
  echo "MinIO is unavailable - sleeping"
  sleep 2
done

echo "[ok] MinIO is ready"
echo "[wait] Checking Redis availability..."

# Проверяем Redis endpoint
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done

echo "[ok] Redis is ready"

echo "[run] Applying migrations..."
npx node-pg-migrate up || echo "Migrations failed or already applied"

echo "[run] Starting server..."
exec npm run dev