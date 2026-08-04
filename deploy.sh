#!/bin/bash
set -e

if [ -f "/home/purushothaman/Videos/LAF---Rebuild/Final-Pro-Key.pem" ]; then
  KEY_PATH="/home/purushothaman/Videos/LAF---Rebuild/Final-Pro-Key.pem"
else
  KEY_PATH="/home/purushothaman/Videos/Final-Pro-Key.pem"
fi
AWS_HOST="ubuntu@98.89.32.42"
REMOTE_DIR="/home/ubuntu/LAF---Rebuild"

echo "======================================================="
echo "  Deploying LAF AI Product to AWS (98.89.32.42)..."
echo "======================================================="

chmod 400 "$KEY_PATH"

echo "1. Syncing project code to AWS server..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$AWS_HOST" "mkdir -p $REMOTE_DIR"
rsync -avz -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  ./ "$AWS_HOST:$REMOTE_DIR/"

echo "2. Building & Deploying Docker Container on Port 3000..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$AWS_HOST" << 'EOF'
  cd /home/ubuntu/LAF---Rebuild
  sudo docker stop laf-ai-product || true
  sudo docker rm laf-ai-product || true
  sudo docker build -t laf-app .
  sudo docker run -d --name laf-ai-product --restart always -p 3000:3000 -v $(pwd)/data:/app/data laf-app
EOF

echo "3. Updating Nginx Site Config to proxy to LAF (127.0.0.1:3000)..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$AWS_HOST" << 'EOF'
  sudo bash -c 'cat << "NGINX_CONF" > /etc/nginx/sites-available/open-webui
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name 98.89.32.42.nip.io 98.89.32.42 _;

    ssl_certificate /etc/letsencrypt/live/98.89.32.42.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/98.89.32.42.nip.io/privkey.pem;

    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_read_timeout 1200s;
        proxy_connect_timeout 1200s;
        proxy_send_timeout 1200s;
        client_max_body_size 100M;

        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 1200s;
    }
}
NGINX_CONF'
  sudo nginx -t
  sudo systemctl reload nginx
EOF

echo "======================================================="
echo "  SUCCESS: LAF AI Platform deployed live on AWS!"
echo "  Access URL: https://98.89.32.42.nip.io or http://98.89.32.42"
echo "======================================================="
