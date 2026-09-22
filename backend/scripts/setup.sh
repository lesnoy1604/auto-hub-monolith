#!/usr/bin/env bash
# Запускается один раз на сервере: создаёт директорию, .env и systemd-сервис.
# Использование: bash setup.sh

set -euo pipefail

APP_DIR="/opt/autohub"
SERVICE_NAME="autohub"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ── Директория ────────────────────────────────────────────────────────────────
echo "→ Создаём $APP_DIR"
sudo mkdir -p "$APP_DIR"

# ── .env ─────────────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo "→ Создаём $APP_DIR/.env"
  JWT_SECRET=$(openssl rand -hex 32)
  sudo tee "$APP_DIR/.env" > /dev/null << EOF
DATABASE_URL=postgresql://autohub:CHANGE_ME@localhost:5432/autohub
JWT_SECRET=${JWT_SECRET}
PORT=8080
ENV=production
EOF
  echo ""
  echo "  ⚠️  Заполни DATABASE_URL в $APP_DIR/.env"
  echo ""
else
  echo "→ $APP_DIR/.env уже существует, пропускаем"
fi

# ── systemd ───────────────────────────────────────────────────────────────────
echo "→ Создаём systemd-сервис $SERVICE_FILE"
sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Auto Hub API
After=network.target

[Service]
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/api
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

echo ""
echo "✓ Готово. Что дальше:"
echo "  1. Заполни DATABASE_URL в $APP_DIR/.env"
echo "  2. Запусти deploy.sh с локальной машины"
