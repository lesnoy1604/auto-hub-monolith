#!/usr/bin/env bash
# Бэкап БД + загруженных файлов.
# Запуск вручную: bash scripts/backup.sh
# Автоматически:  cron каждую ночь в 03:00 (настраивается в crontab)
#
# Итог: /opt/autohub/backups/YYYY-MM-DD_HH-MM/
#         db.sql.gz      — дамп PostgreSQL
#         uploads.tar.gz — папка с фото

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/autohub}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"   # сколько дней хранить бэкапы

# Цвета
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── Конфиг ────────────────────────────────────────────────────────────────────
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  fail "Файл $ENV_FILE не найден"
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

DATABASE_URL="${DATABASE_URL:?DATABASE_URL не задан в .env}"
UPLOADS_DIR="${APP_DIR}/uploads"

# ── Папка для этого бэкапа ────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M')
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "▶ Бэкап Auto Hub → $BACKUP_DIR"
echo ""

# ── 1. Дамп БД ────────────────────────────────────────────────────────────────
info "[1/3] Дамп PostgreSQL..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/db.sql.gz"
DB_SIZE=$(du -sh "$BACKUP_DIR/db.sql.gz" | cut -f1)
ok "db.sql.gz ($DB_SIZE)"

# ── 2. Архив загрузок ─────────────────────────────────────────────────────────
info "[2/3] Архивирование uploads..."
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$APP_DIR" uploads/
  UP_SIZE=$(du -sh "$BACKUP_DIR/uploads.tar.gz" | cut -f1)
  ok "uploads.tar.gz ($UP_SIZE)"
else
  echo "   uploads/ пуста — пропускаем"
  touch "$BACKUP_DIR/uploads.tar.gz"
  ok "uploads.tar.gz (пусто)"
fi

# ── 3. Ротация: удалить старше KEEP_DAYS дней ────────────────────────────────
info "[3/3] Ротация бэкапов (хранить $KEEP_DAYS дней)..."
REMOVED=0
while IFS= read -r old_dir; do
  rm -rf "$old_dir"
  REMOVED=$((REMOVED + 1))
done < <(find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d -mtime "+$KEEP_DAYS")
ok "Удалено старых бэкапов: $REMOVED"

# ── Итог ──────────────────────────────────────────────────────────────────────
TOTAL=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "  Папка:  $BACKUP_DIR ($TOTAL)"
COUNT=$(find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')
echo "  Всего бэкапов: $COUNT (хранится $KEEP_DAYS дней)"
