#!/bin/bash

echo "=== PollClass - Despliegue con ngrok ==="

echo ""
echo "1. Verificando MongoDB..."
if lsof -i :27017 | grep -q mongod; then
    echo "   ✓ MongoDB está corriendo"
else
    echo "   ✗ MongoDB no está corriendo. Inícialo con: mongod --dbpath <tu_ruta>"
    exit 1
fi

echo ""
echo "2. Verificando Bun..."
if command -v bun &> /dev/null; then
    echo "   ✓ Bun está instalado"
else
    echo "   ✗ Bun no está instalado"
    exit 1
fi

echo ""
echo "3. Verificando ngrok..."
if command -v ngrok &> /dev/null; then
    echo "   ✓ ngrok está instalado"
else
    echo "   ✗ ngrok no está instalado. Instálalo desde https://ngrok.com/download"
    exit 1
fi

echo ""
echo "4. Iniciando servidor backend..."
cd server
nohup bun index.ts > ../server.log 2>&1 &
SERVER_PID=$!
sleep 2

if curl -s http://localhost:3001/ | grep -q "PollClass"; then
    echo "   ✓ Servidor backend corriendo en http://localhost:3001"
else
    echo "   ✗ Error iniciando el servidor backend"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "5. Iniciando frontend (Vite)..."
cd ../client
nohup bun run dev > ../client.log 2>&1 &
VITE_PID=$!
sleep 3

if curl -s http://localhost:5173/ | grep -q "PollClass"; then
    echo "   ✓ Frontend corriendo en http://localhost:5173"
else
    echo "   ✗ Error iniciando el frontend"
    kill $SERVER_PID $VITE_PID 2>/dev/null
    exit 1
fi

echo ""
echo "6. Iniciando ngrok..."
ngrok http 5173 > ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

NGROK_URL=$(grep -o 'https://[^ ]*\.ngrok-free\.app' ngrok.log 2>/dev/null | head -1)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "=============================================="
    echo "   🎉 ¡PollClass está desplegado!"
    echo "=============================================="
    echo ""
    echo "   URL para estudiantes: $NGROK_URL"
    echo "   (Los estudiantes se conectan desde su celular)"
    echo ""
    echo "   Panel del profesor: $NGROK_URL/professor"
    echo "   (Para crear encuestas y ver resultados)"
    echo ""
    echo "=============================================="
    echo ""
    echo "Presiona Ctrl+C para detener todos los servicios"
    echo ""
    
    # Mantener corriendo
    trap "kill $SERVER_PID $VITE_PID $NGROK_PID 2>/dev/null; echo 'Servicios detenidos'" EXIT
    
    while true; do
        sleep 1
    done
else
    echo "   ✗ Error iniciando ngrok"
    kill $SERVER_PID $VITE_PID $NGROK_PID 2>/dev/null
    exit 1
fi
