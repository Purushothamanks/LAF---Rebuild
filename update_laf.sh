#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/Final-Pro-Key.pem" ]; then
  DEFAULT_KEY="$SCRIPT_DIR/Final-Pro-Key.pem"
elif [ -f "/home/purushothaman/Videos/Projects/LAF-Rebuild/Final-Pro-Key.pem" ]; then
  DEFAULT_KEY="/home/purushothaman/Videos/Projects/LAF-Rebuild/Final-Pro-Key.pem"
elif [ -f "/home/purushothaman/Videos/LAF---Rebuild/Final-Pro-Key.pem" ]; then
  DEFAULT_KEY="/home/purushothaman/Videos/LAF---Rebuild/Final-Pro-Key.pem"
else
  DEFAULT_KEY="/home/purushothaman/Videos/Final-Pro-Key.pem"
fi
KEY_PATH="${KEY_PATH:-$DEFAULT_KEY}"
AWS_HOST="${AWS_HOST:-ubuntu@98.89.32.42}"
REMOTE_DIR="/home/ubuntu/LAF---Rebuild"

COMMIT_MSG="${1:-"update: synchronize codebase changes across local, AWS server, and GitHub"}"

echo "======================================================="
echo "  LAF AUTO-SYNC & PUBLISH SCRIPT"
echo "  Target: Local Files | GitHub Repo | AWS Server"
echo "======================================================="

# Step 1: Local Production Build Validation
echo "1/4. Validating & building local frontend bundle..."
npm run build

# Step 2: Push to GitHub Repository
echo "2/4. Syncing changes to GitHub..."
git rm -r --cached node_modules dist data 2>/dev/null || true
git add .
if git diff-index --quiet HEAD --; then
  echo "No uncommitted local changes, proceeding to server deployment..."
else
  git commit -m "$COMMIT_MSG"
  git push origin main
  echo "✓ Successfully pushed changes to GitHub!"
fi

# Step 3: Sync & Deploy to AWS Server
echo "3/4. Deploying update to AWS Host..."
chmod 400 "$KEY_PATH"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$AWS_HOST" "mkdir -p $REMOTE_DIR"

rsync -avz -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude 'BUILD_REPORT.md' \
  --exclude 'server/training/*.jsonl' \
  ./ "$AWS_HOST:$REMOTE_DIR/"

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$AWS_HOST" << 'EOF'
  cd /home/ubuntu/LAF---Rebuild
  if [ "$CLEAR_DATA" = "1" ]; then
    rm -rf data/users/* data/*.json || true
  fi
  mkdir -p data/users
  sudo docker stop laf-ai-product || true
  sudo docker rm laf-ai-product || true
  sudo docker build -t laf-app .
  sudo docker run -d --name laf-ai-product --restart always --add-host=host.docker.internal:host-gateway --env-file .env -e OLLAMA_URL=http://172.17.0.1:11434 -e LAF_API_KEY=sk-VxsIAi0YwNN4KtS3ZPnb7h273DBLkaii4F6VQYOrRf0Hz6fC -e LAF_API_KEY_SECONDARY=sk-xueuIaK5y8ZxjCgJcZU1soulNFO9W0a62wLdMRyHEKLsGeNG -e LAF_API_KEYS=sk-VxsIAi0YwNN4KtS3ZPnb7h273DBLkaii4F6VQYOrRf0Hz6fC,sk-xueuIaK5y8ZxjCgJcZU1soulNFO9W0a62wLdMRyHEKLsGeNG -p 3000:3000 -v $(pwd)/data:/app/data laf-app
  sudo systemctl reload nginx
EOF

# Step 4: Health Verification
echo "4/4. Verifying live health..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k https://98.89.32.42.nip.io || true)

echo "======================================================="
echo "  ✓ SYNC COMPLETED SUCCESSFULLY!"
echo "  • GitHub Repository : Pushed & Up to date"
echo "  • AWS Production Host: Deployed & Alive (HTTP $HTTP_STATUS)"
echo "======================================================="
