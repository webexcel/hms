#!/bin/bash
# =============================================================================
# Hotel Management System - Database Backup Script
#
# Usage:
#   ./backup.sh                    # Backup all databases
#   ./backup.sh --db hotel_udhayam # Backup specific database
#   ./backup.sh --restore latest   # Restore most recent backup
#   ./backup.sh --list             # List available backups
#
# Crontab (daily at 2 AM):
#   0 2 * * * /path/to/hotel/server/scripts/backup.sh >> /var/log/hotel-backup.log 2>&1
#
# Environment variables (from .env or exported):
#   DB_USER     - MySQL user (default: root)
#   DB_PASS     - MySQL password (default: empty)
#   DB_HOST     - MySQL host (default: localhost)
#   BACKUP_DIR  - Backup directory (default: ./backups)
#   RETENTION   - Days to keep backups (default: 30)
# =============================================================================

set -euo pipefail

# Load .env if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Config
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
RETENTION="${RETENTION:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASES=("hotel_master" "hotel_udhayam")

# MySQL auth args (avoid password on command line warning)
MYSQL_ARGS="-u$DB_USER -h$DB_HOST"
if [ -n "$DB_PASS" ]; then
  MYSQL_ARGS="$MYSQL_ARGS -p$DB_PASS"
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
err()  { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2; }

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# ─── List backups ────────────────────────────────────────────────────
list_backups() {
  log "Available backups in $BACKUP_DIR:"
  echo ""
  if ls "$BACKUP_DIR"/*.sql.gz 1>/dev/null 2>&1; then
    ls -lhS "$BACKUP_DIR"/*.sql.gz | awk '{print $5, $9}' | while read size file; do
      echo "  $size  $(basename "$file")"
    done
  else
    echo "  (no backups found)"
  fi
  echo ""
}

# ─── Backup a single database ───────────────────────────────────────
backup_db() {
  local db_name=$1
  local outfile="$BACKUP_DIR/${db_name}_${TIMESTAMP}.sql.gz"

  log "Backing up $db_name..."
  if mysqldump $MYSQL_ARGS --single-transaction --triggers "$db_name" | gzip > "$outfile"; then
    local size=$(du -h "$outfile" | cut -f1)
    log "  ✓ $db_name → $(basename "$outfile") ($size)"
    return 0
  else
    err "  ✗ Failed to backup $db_name"
    rm -f "$outfile"
    return 1
  fi
}

# ─── Backup all databases ───────────────────────────────────────────
backup_all() {
  local target_db="${1:-}"
  local failed=0
  local success=0

  log "Starting backup..."
  log "Backup dir: $BACKUP_DIR"
  log "Retention: $RETENTION days"
  echo ""

  if [ -n "$target_db" ]; then
    DATABASES=("$target_db")
  fi

  for db in "${DATABASES[@]}"; do
    if backup_db "$db"; then
      success=$((success + 1))
    else
      failed=$((failed + 1))
    fi
  done

  echo ""
  log "Backup complete: $success succeeded, $failed failed"

  # Cleanup old backups
  local deleted=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION -delete -print | wc -l)
  if [ "$deleted" -gt 0 ]; then
    log "Cleaned up $deleted backup(s) older than $RETENTION days"
  fi

  # Verify: check that we have at least one backup per database
  echo ""
  log "Current backups:"
  for db in "${DATABASES[@]}"; do
    local count=$(ls "$BACKUP_DIR"/${db}_*.sql.gz 2>/dev/null | wc -l)
    if [ "$count" -gt 0 ]; then
      log "  ✓ $db: $count backup(s)"
    else
      warn "  ✗ $db: no backups found!"
    fi
  done

  return $failed
}

# ─── Restore a backup ───────────────────────────────────────────────
restore_backup() {
  local target=$1

  if [ "$target" = "latest" ]; then
    target=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
    if [ -z "$target" ]; then
      err "No backups found in $BACKUP_DIR"
      exit 1
    fi
  fi

  if [ ! -f "$target" ]; then
    # Try as basename
    target="$BACKUP_DIR/$target"
  fi

  if [ ! -f "$target" ]; then
    err "Backup file not found: $target"
    exit 1
  fi

  # Extract database name from filename (e.g., hotel_udhayam_20260316_020000.sql.gz)
  local filename=$(basename "$target" .sql.gz)
  local db_name=$(echo "$filename" | sed 's/_[0-9]\{8\}_[0-9]\{6\}$//')

  warn "This will OVERWRITE database '$db_name' with backup: $(basename "$target")"
  read -p "Are you sure? (type 'yes' to confirm): " confirm
  if [ "$confirm" != "yes" ]; then
    log "Restore cancelled."
    exit 0
  fi

  log "Restoring $db_name from $(basename "$target")..."
  if gunzip -c "$target" | mysql $MYSQL_ARGS "$db_name"; then
    log "  ✓ $db_name restored successfully"
  else
    err "  ✗ Restore failed!"
    exit 1
  fi
}

# ─── Main ────────────────────────────────────────────────────────────
case "${1:-}" in
  --list)
    list_backups
    ;;
  --restore)
    if [ -z "${2:-}" ]; then
      err "Usage: $0 --restore <file|latest>"
      exit 1
    fi
    restore_backup "$2"
    ;;
  --db)
    if [ -z "${2:-}" ]; then
      err "Usage: $0 --db <database_name>"
      exit 1
    fi
    backup_all "$2"
    ;;
  --help|-h)
    head -15 "$0" | tail -13
    ;;
  *)
    backup_all ""
    ;;
esac
