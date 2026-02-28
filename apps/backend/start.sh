#!/bin/sh
set -e

echo "=== DEBUG: package.json ==="
cat package.json
echo ""
echo "=== DEBUG: node_modules contents ==="
ls node_modules/ 2>/dev/null | head -30
echo ""
echo "=== DEBUG: express resolve test ==="
node -e "try { console.log('express at:', require.resolve('express')); } catch(e) { console.log('FAIL:', e.message); }"
echo "=== END DEBUG ==="

echo "Running migrations..."
npx prisma migrate deploy
echo "Starting server..."
exec node main.js
