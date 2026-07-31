#!/bin/sh
echo "Starting database migration..."
npm run migration:run

echo "Starting server..."
node dist/main
