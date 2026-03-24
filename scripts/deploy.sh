#!/bin/bash
set -e

# ----------- config -----------
SERVICE="nexo_stoa"
IMAGE="nexo-stoa"
APP_DIR="/home/deploy/apps/stoa"
BACKUP_DIR="/home/deploy/backups/stoa"
DB_HOST="infra_postgres"
DB_USER="clickup"
DB_PASS="clickup2026prod"
DB_NAME="stoa"
KEEP_BACKUPS=7
KEEP_IMAGES=3
# ------------------------------

cd "$APP_DIR"

SHA=$(git rev-parse --short HEAD)
DATE=$(date +%Y%m%d-%H%M)
VERSION="deploy-${DATE}-${SHA}"

echo "=== DEPLOY $VERSION ==="

# 1. backup banco
mkdir -p "$BACKUP_DIR"
echo "[1/5] backup banco..."
PG_CONTAINER=$(docker ps --filter name=infra_postgres -q | head -1)
if [ -z "$PG_CONTAINER" ]; then
  echo "  AVISO: container infra_postgres nao encontrado, pulando backup"
else
  docker exec -e PGPASSWORD="$DB_PASS" "$PG_CONTAINER" \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    | gzip > "${BACKUP_DIR}/${VERSION}.sql.gz"
  echo "  salvo: ${BACKUP_DIR}/${VERSION}.sql.gz"
fi

# prune backups antigos
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS+1)) | xargs -r rm --
echo "  backups retidos: $(ls "$BACKUP_DIR"/*.sql.gz | wc -l)"

# 2. build imagem com versão
echo "[2/5] build docker..."
docker build \
  -t "${IMAGE}:latest" \
  -t "${IMAGE}:${VERSION}" \
  "$APP_DIR"

# 3. atualizar serviço com imagem versionada (não :latest)
echo "[3/5] atualizando serviço..."
docker service update \
  --image "${IMAGE}:${VERSION}" \
  --force "$SERVICE"

# 4. git tag
echo "[4/5] criando git tag..."
git tag "$VERSION" 2>/dev/null || echo "  (tag ja existe, pulando)"
git push origin "$VERSION" 2>/dev/null || echo "  (push de tag falhou — tag local criada)"

# 5. prune imagens antigas
echo "[5/5] limpando imagens antigas..."
docker images "${IMAGE}" --format "{{.Tag}}\t{{.ID}}" \
  | grep "^deploy-" \
  | sort -r \
  | tail -n +$((KEEP_IMAGES+1)) \
  | awk '{print $2}' \
  | xargs -r docker rmi 2>/dev/null || true

echo ""
echo "=== DONE ==="
echo "versao: $VERSION"
echo ""
echo "rollback:"
echo "  docker service update --image ${IMAGE}:{VERSION_ANTERIOR} --force $SERVICE"
echo "restore db:"
echo "  gunzip -c ${BACKUP_DIR}/{BACKUP}.sql.gz | docker exec -i \$(docker ps --filter name=infra_postgres -q | head -1) psql -U $DB_USER $DB_NAME"
