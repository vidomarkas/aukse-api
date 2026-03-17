#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding default categories..."
npx tsx prisma/seed.ts

echo "Starting API server..."
exec node dist/index.js
