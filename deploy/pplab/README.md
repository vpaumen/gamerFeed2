# Running GamerFeed2 in pplab (Proxmox)

The app runs in one unprivileged Debian 12 LXC with Docker Compose:

- `app`: Node 14, Express on port 3001, serving the built React client
- `db`: MariaDB 10.11, data in the `db_data` volume

## 1. Create the container (on the Proxmox host)

```bash
# copy create-lxc.sh and setup.sh to the Proxmox host, then:
CTID=210 IP=dhcp ./create-lxc.sh
# or with a static address:
CTID=210 IP=192.168.1.50/24 GW=192.168.1.1 ./create-lxc.sh
```

Defaults: 2 cores, 2 GB RAM, 16 GB disk on `local-lvm`, bridge `vmbr0`,
`nesting=1,keyctl=1` (needed for Docker), starts on boot. All are overridable
with env vars (see the top of the script).

## 2. Install Docker and the app (inside the container)

```bash
pct push 210 setup.sh /root/setup.sh
pct exec 210 -- bash /root/setup.sh
```

## 3. Configure and start

```bash
pct enter 210
cd /opt/gamerfeed
nano .env          # set DB_ROOT_PASSWORD, DB_PASSWORD, GAME_API_KEY (from rawg.io/apidocs), YOUTUBE_API_KEY (optional)
docker compose up -d --build
docker compose logs -f app   # wait for "App now listening on port: 3001"
```

Open `http://<container-ip>/`. The first build takes a few minutes.

## Day-to-day

| Task | Command (in `/opt/gamerfeed`) |
|---|---|
| Update to latest code | `git pull && docker compose up -d --build` |
| Logs | `docker compose logs -f app` |
| Load demo users | `docker compose exec app npx sequelize db:seed:all --env production` |
| DB shell | `docker compose exec db mariadb -u gamerfeed -p gamerfeed_db` |
| Stop | `docker compose down` (data is kept in the volume) |

Back up the whole container with a Proxmox backup job; the database volume lives inside it.
