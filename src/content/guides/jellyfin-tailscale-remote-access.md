---
title: "Jellyfin Remote Access with Tailscale on Ubuntu"
description: "Access Jellyfin remotely with Tailscale on Ubuntu without port forwarding, DDNS, or a public reverse proxy. Includes setup, MagicDNS, testing, and fixes."
pubDate: 2026-01-21
updatedDate: 2026-07-08
tags: ["jellyfin", "tailscale", "remote-access", "security", "ubuntu"]
cover: "/images/guides/jellyfin-tailscale-remote-access-diagram.webp"
---

## Quick answer

Install Tailscale on the Ubuntu Jellyfin server and on each trusted client device. Then connect to Jellyfin using the server's private Tailscale IP:

```text
http://100.x.x.x:8096
```

This gives you private remote access without opening Jellyfin to the public internet, changing router rules, setting up dynamic DNS, or running a public reverse proxy.

---

## What you need

- Jellyfin already working on your home network
- Ubuntu terminal or SSH access
- a Tailscale account
- Tailscale installed on each remote client

Confirm Jellyfin works locally first:

```text
http://YOUR-LAN-IP:8096
```

If local access fails, fix Jellyfin before troubleshooting Tailscale.

---

## Step 1: Install Tailscale on Ubuntu

Run on the Jellyfin server:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

Start the login process:

```bash
sudo tailscale up
```

Open the login URL printed in the terminal and approve the server.

Check the connection:

```bash
tailscale status
```

---

## Step 2: Find the server's Tailscale IP

Run:

```bash
tailscale ip -4
```

Example:

```text
100.89.21.37
```

Your address will be different.

---

## Step 3: Install Tailscale on the client

Install Tailscale on the phone, tablet, laptop, or other device you will use away from home.

Sign in to the same tailnet and confirm it is connected.

The client and Jellyfin server should both appear in:

```bash
tailscale status
```

---

## Step 4: Open Jellyfin remotely

On the connected client, open:

```text
http://TAILSCALE-IP:8096
```

Example:

```text
http://100.89.21.37:8096
```

Test properly by switching a phone from home Wi-Fi to mobile data.

---

## Step 5: Use MagicDNS

MagicDNS gives the server a memorable private hostname.

After enabling MagicDNS in the Tailscale admin console, the server may be reachable at an address similar to:

```text
http://jellyfin-server:8096
```

or:

```text
http://jellyfin-server.tailnet-name.ts.net:8096
```

The client still needs to be connected to Tailscale.

---

## Do you need port forwarding?

No. A normal Tailscale setup does not require a public Jellyfin port-forwarding rule.

The connection path is:

```text
Remote client → Tailscale → Ubuntu server → Jellyfin port 8096
```

Review and remove old public router rules when they are no longer needed.

---

## Jellyfin works locally but not through Tailscale

Check both services:

```bash
systemctl status jellyfin --no-pager
systemctl status tailscaled --no-pager
tailscale status
```

From another Tailscale device, test the server:

```bash
tailscale ping JELLYFIN-SERVER-NAME
```

You can also try the Tailscale IP directly.

If Tailscale ping fails, troubleshoot Tailscale connectivity. If ping works but port 8096 does not load, inspect Jellyfin or the server firewall.

---

## Check the Ubuntu firewall

Check whether UFW is active:

```bash
sudo ufw status
```

A simple rule restricted to the Tailscale interface is:

```bash
sudo ufw allow in on tailscale0 to any port 8096 proto tcp
```

Only add firewall rules when UFW is active and blocking the connection.

---

## Phone works on Wi-Fi but not mobile data

Check that:

- Tailscale is connected on the phone
- battery optimisation is not suspending Tailscale
- mobile VPN permissions are enabled
- the Jellyfin URL uses the Tailscale address rather than the LAN address

A private LAN address such as `192.168.1.50` will not normally work away from home.

---

## Remote playback buffers

Tailscale provides the route; it does not increase your home upload speed.

Check:

- home upload bandwidth
- media bitrate
- Jellyfin client quality setting
- whether video is transcoding
- mobile signal quality

Use [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/) to identify the playback mode.

For remote viewing, a separate 1080p version may be more practical than transcoding high-bitrate 4K media.

---

## HTTP and HTTPS

Traffic between Tailscale devices travels through the encrypted Tailscale connection. For a private first setup, this is commonly accessed as:

```text
http://TAILSCALE-IP:8096
```

You can add private HTTPS later, but it is not required to prove the remote-access path works.

Do not expose the plain HTTP Jellyfin port directly to the public internet.

---

## Exact verification sequence

On the server:

```bash
systemctl status jellyfin --no-pager
systemctl status tailscaled --no-pager
tailscale status
tailscale ip -4
sudo ss -lntp | grep 8096
```

On the client:

```bash
tailscale status
tailscale ping JELLYFIN-SERVER-NAME
```

Then open:

```text
http://TAILSCALE-IP:8096
```

---

## Related guides

- [Install Jellyfin on Ubuntu](/guides/jellyfin-ubuntu-low-power/)
- [Jellyfin Remote Access Safely](/guides/jellyfin-remote-access-safely/)
- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

Install Tailscale on the Ubuntu server and trusted clients, connect them to the same tailnet, and open Jellyfin using the private Tailscale IP or MagicDNS hostname.

This is the SmallGrid default for simple private Jellyfin remote access.