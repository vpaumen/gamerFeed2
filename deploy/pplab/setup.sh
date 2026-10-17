#!/usr/bin/env bash
# Run inside the GamerFeed LXC (as root). Installs Docker, clones the app and prepares .env.
set -euo pipefail

REPO="${REPO:-https://github.com/vpaumen/gamerFeed2.git}"
APP_DIR="${APP_DIR:-/opt/gamerfeed}"

apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl git

# Docker Engine + Compose plugin from Docker's Debian repo
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if [ ! -d "$APP_DIR/.git" ]; then
  # Deploys only ever run master; work happens on improvements-branch and is merged in first
  git clone --branch master "$REPO" "$APP_DIR"
fi

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo
  echo "Created $APP_DIR/.env from the example. Fill in the passwords and GAME_API_KEY, then run:"
else
  echo "Existing .env kept. To start the app, run:"
fi
echo "  cd $APP_DIR && docker compose up -d --build"
