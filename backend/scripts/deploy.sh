#!/usr/bin/env bash
# Деплой на сервер: сборка бинарника → заливка → перезапуск сервиса.
#
# Использование:
#   bash scripts/deploy.sh user@1.2.3.4
#
# Опционально через переменные окружения:
#   REMOTE_USER=ubuntu REMOTE_HOST=1.2.3.4 bash scripts/deploy.sh

set -euo pipefail

# ── Параметры ─────────────────────────────────────────────────────────────────
if [ $# -ge 1 ]; then
  REMOTE_USER="${1%%@*}"
  REMOTE_HOST="${1##*@}"
else
  REMOTE_USER="${REMOTE_USER:-}"
  REMOTE_HOST="${REMOTE_HOST:-}"
fi

if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ]; then
  echo "Использование: $0 user@host"
  echo "  или задай REMOTE_USER и REMOTE_HOST как переменные окружения"
  exit 1
fi

APP_DIR="/opt/autohub"
SERVICE_NAME="autohub"
BINARY_LOCAL="bin/api"
SEED_LOCAL="bin/seed"
MIGRATIONS_DIR="migrations"

echo "▶ Деплой на ${REMOTE_USER}@${REMOTE_HOST}"
echo ""

# ── 1. Сборка ─────────────────────────────────────────────────────────────────
echo "→ [1/4] Сборка бинарника для Linux..."
mkdir -p bin
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "$BINARY_LOCAL" ./cmd/api/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "$SEED_LOCAL"   ./cmd/seed/main.go
echo "   ✓ bin/api ($(du -sh $BINARY_LOCAL | cut -f1))"

# ── 2. Заливка ────────────────────────────────────────────────────────────────
echo "→ [2/4] Копируем файлы на сервер..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo mkdir -p $APP_DIR && sudo chown \$(whoami) $APP_DIR"
scp -q "$BINARY_LOCAL"   "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/api"
scp -q "$SEED_LOCAL"     "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/seed"
scp -qr "$MIGRATIONS_DIR" "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod +x ${APP_DIR}/api ${APP_DIR}/seed"
echo "   ✓ файлы скопированы"

# ── 3. Перезапуск ────────────────────────────────────────────────────────────
echo "→ [3/4] Перезапускаем сервис..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo systemctl restart $SERVICE_NAME"
sleep 2

# ── 4. Проверка ───────────────────────────────────────────────────────────────
echo "→ [4/4] Проверяем здоровье сервиса..."
STATUS=$(ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo systemctl is-active $SERVICE_NAME")

if [ "$STATUS" = "active" ]; then
  echo ""
  echo "✓ Деплой успешен! Сервис запущен."
  echo ""
  # Показать последние строки лога
  ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo journalctl -u $SERVICE_NAME -n 10 --no-pager"
else
  echo ""
  echo "✗ Сервис не запустился. Логи:"
  ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo journalctl -u $SERVICE_NAME -n 30 --no-pager"
  exit 1
fi

echo ""
echo "  API:     http://${REMOTE_HOST}:8080/api/health"
echo "  Swagger: http://${REMOTE_HOST}:8080/swagger/index.html"
