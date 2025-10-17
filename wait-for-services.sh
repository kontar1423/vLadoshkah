#!/bin/sh

set -e

echo "⏳ Waiting for database to be ready..."

# Проверяем не только порт, но и возможность подключения
until pg_isready -h db -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready"

echo "⏳ Waiting for MinIO..."

# Проверяем MinIO API endpoint
until curl -f http://minio:9000/minio/health/live; do
  echo "MinIO is unavailable - sleeping"
  sleep 2
done

echo "✅ MinIO is ready"

echo "🚀 Running migrations..."
npx node-pg-migrate up || echo "Migrations failed or already applied"

echo "🚀 Starting server..."
exec npm run dev