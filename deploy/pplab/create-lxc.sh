#!/usr/bin/env bash
# Run on the Proxmox host (as root) to create the GamerFeed LXC.
# Override any setting on the command line, e.g.:
#   CTID=210 IP=192.168.1.50/24 GW=192.168.1.1 ./create-lxc.sh
set -euo pipefail

CTID="${CTID:-210}"
HOSTNAME="${HOSTNAME_CT:-gamerfeed}"
STORAGE="${STORAGE:-local-lvm}"          # rootfs storage
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"
BRIDGE="${BRIDGE:-vmbr0}"
IP="${IP:-dhcp}"                         # e.g. 192.168.1.50/24, or dhcp
GW="${GW:-}"                             # required when IP is static
CORES="${CORES:-2}"
MEMORY="${MEMORY:-2048}"                 # MB; the React build needs ~1.5 GB
DISK="${DISK:-16}"                       # GB

if pct status "$CTID" >/dev/null 2>&1; then
  echo "CT $CTID already exists; pick another CTID." >&2
  exit 1
fi

# Find and download the newest Debian 12 template if it isn't cached yet
pveam update >/dev/null
TEMPLATE="$(pveam available --section system | awk '/debian-12-standard/ {print $2}' | sort -V | tail -1)"
if ! pveam list "$TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

NET="name=eth0,bridge=${BRIDGE},ip=${IP}"
if [ "$IP" != "dhcp" ]; then
  NET="${NET},gw=${GW:?GW is required for a static IP}"
fi

pct create "$CTID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
  --hostname "$HOSTNAME" \
  --cores "$CORES" \
  --memory "$MEMORY" \
  --swap 512 \
  --rootfs "${STORAGE}:${DISK}" \
  --net0 "$NET" \
  --unprivileged 1 \
  --features nesting=1,keyctl=1 \
  --onboot 1 \
  --ostype debian

pct start "$CTID"
echo "CT $CTID created and started."
echo "Next: copy setup.sh into it and run it:"
echo "  pct push $CTID setup.sh /root/setup.sh && pct exec $CTID -- bash /root/setup.sh"
