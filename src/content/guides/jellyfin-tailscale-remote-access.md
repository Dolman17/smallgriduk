---
title: "Remote Jellyfin with Tailscale: Private Access Setup"
description: "Use Tailscale to reach Jellyfin remotely without DDNS, router changes, or a public reverse proxy."
pubDate: 2026-01-21
tags: ["jellyfin", "tailscale", "remote-access", "security"]
cover: "/images/guides/jellyfin-tailscale-remote-access-diagram.webp"
---

## Goal

Reach your Jellyfin server from your phone, laptop, tablet, or another trusted device when you are away from home.

The SmallGrid default is:

- install Tailscale on the Jellyfin server
- install Tailscale on your client devices
- connect to Jellyfin using the private Tailscale IP or MagicDNS hostname
- keep the setup simple and private

This gives you remote access without needing dynamic DNS or a public reverse proxy.

---

## The default recommendation

Use Tailscale for private remote access.

Tailscale creates a private network between your own devices, so you can reach Jellyfin using a private address.

For most home Jellyfin setups, this is simpler than:

- dynamic DNS
- public reverse proxies
- router-level remote-access rules
- managing certificates before you have the basics working

Start with private access first. Polish later.

---

## What Tailscale does here

Tailscale creates a private mesh network called a tailnet.

Your devices join that tailnet:

```text
Jellyfin server
Laptop
Phone
Tablet
Other trusted devices
```

Each device gets a private Tailscale IP address, usually starting with `100.`.

Example:

```text
Jellyfin server: 100.89.21.37
Phone:           100.71.10.22
Laptop:          100.82.44.10
```

Then you connect to Jellyfin using the server’s private Tailscale address:

```text
http://100.89.21.37:8096
```

That works from another network as long as both devices are signed into the same Tailscale network and allowed to communicate.

---

## What you’ll need

- Jellyfin already installed and working on your home network
- SSH or terminal access to the Jellyfin server
- A Tailscale account
- Tailscale installed on any remote devices you want to use

If Jellyfin is not installed yet, start with [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/).

If Jellyfin cannot see your media folders, fix that first with [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## Step 1: Confirm Jellyfin works locally

Before adding remote access, make sure Jellyfin works at home.

On a device connected to your home network, open:

```text
http://YOUR-SERVER-LAN-IP:8096
```

Example:

```text
http://192.168.1.50:8096
```

You should see the Jellyfin login page.

If Jellyfin does not work locally, do not start troubleshooting Tailscale yet. Fix the local Jellyfin setup first.

Check the service on Ubuntu:

```bash
systemctl status jellyfin --no-pager
```

---

## Step 2: Install Tailscale on the Jellyfin server

On the Jellyfin server, install Tailscale:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

Start the Tailscale login process:

```bash
sudo tailscale up
```

The command will print a login URL.

Open that URL in a browser, sign in to your Tailscale account, and approve the device.

Once approved, check Tailscale status:

```bash
tailscale status
```

You should see this server listed with a private `100.x.x.x` address.

---

## Step 3: Find the Jellyfin server’s Tailscale IP

Run:

```bash
tailscale ip
```

You may see two addresses:

```text
100.89.21.37
fd7a:115c:a1e0:ab12:4843:cd96:624d:1234
```

Use the first one, the `100.x.x.x` IPv4 address.

For this guide, the example server IP is:

```text
100.89.21.37
```

Your actual address will be different.

---

## Step 4: Install Tailscale on your client devices

Install Tailscale on the devices you want to use away from home.

Common options:

- laptop
- phone
- tablet
- travel device
- another trusted computer

Sign in with the same Tailscale account you used for the server.

On a laptop or desktop, you can check the connection with:

```bash
tailscale status
```

You should see both:

- the client device you are using
- the Jellyfin server

On mobile, open the Tailscale app and make sure it is connected.

---

## Step 5: Connect to Jellyfin over Tailscale

On a Tailscale-connected device, open:

```text
http://TAILSCALE-SERVER-IP:8096
```

Using the example address:

```text
http://100.89.21.37:8096
```

You should see the normal Jellyfin login page.

Log in with your Jellyfin account.

If it works on your home Wi-Fi, test it properly by switching your phone to mobile data and trying the same address again.

---

## Step 6: Use MagicDNS for a cleaner address

Typing an IP address works, but MagicDNS is easier to remember.

In the Tailscale admin console, enable MagicDNS.

Your server will then have a tailnet hostname, something like:

```text
jellyfin-server.tailnet-name.ts.net
```

Then you can open Jellyfin using:

```text
http://jellyfin-server.tailnet-name.ts.net:8096
```

You still need Tailscale connected on the client device. The hostname is private to your tailnet.

---

## Step 7: Keep the access path simple

The clean setup is:

```text
Client device → Tailscale → Jellyfin server → Jellyfin on port 8096
```

You do not need to add extra layers until there is a real reason.

If you previously created router rules, DDNS entries, or reverse proxy rules for Jellyfin, review whether you still need them. For most simple home setups, Tailscale becomes the remote access path.

---

## Step 8: Check Jellyfin networking settings

In Jellyfin, go to:

```text
Dashboard → Networking
```

For a basic home setup, the default settings are usually fine.

Avoid changing advanced network settings unless you are fixing a specific problem.

The important test is simple: Jellyfin should work locally, and Jellyfin should work through the Tailscale address.

---

## Step 9: Test the setup properly

Use this checklist:

```text
Jellyfin works on the home LAN
Tailscale is connected on the server
Tailscale is connected on the client device
Client can see the server in tailscale status
http://TAILSCALE-IP:8096 opens Jellyfin
Mobile data test works
```

Useful server checks:

```bash
systemctl status jellyfin --no-pager
tailscale status
tailscale ip
```

Useful client check:

```bash
tailscale status
```

If all of those pass, the basic remote access setup is working.

---

## Troubleshooting

### Jellyfin works at home but not over Tailscale

Check that Tailscale is connected on both devices:

```bash
tailscale status
```

Then try pinging the server’s Tailscale IP from the client:

```bash
ping 100.89.21.37
```

Replace the example IP with your server’s real Tailscale IP.

If ping fails, this is a Tailscale connectivity issue, not a Jellyfin issue.

### Tailscale connects, but Jellyfin does not load

Check Jellyfin is running:

```bash
systemctl status jellyfin --no-pager
```

Check the local Jellyfin URL from the server or LAN:

```text
http://YOUR-SERVER-LAN-IP:8096
```

If local access fails too, fix Jellyfin before troubleshooting remote access.

### The phone works on Wi-Fi but not on mobile data

Open the Tailscale app and confirm it is connected.

Some phones disconnect VPN-style apps when power saving is enabled. Disable aggressive battery optimisation for Tailscale if needed.

### Streaming is slow remotely

Tailscale gives you access. It does not increase the upload speed from home.

If remote playback buffers, check:

- your home upload speed
- the media bitrate
- whether Jellyfin is transcoding
- client quality settings
- mobile signal strength

For Jellyfin playback behaviour, see [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/).

---

## What about HTTPS?

For a private Tailscale setup, plain `http://TAILSCALE-IP:8096` is often acceptable for a simple first version because the traffic is travelling through the Tailscale connection.

You can add HTTPS later if you want a cleaner browser experience, but do not make HTTPS the first problem you solve.

First make remote access work privately. Then polish.

---

## Multiple services? Use the same pattern

Once Tailscale works, you can reach other private services in the same way.

Examples:

```text
Proxmox:        https://TAILSCALE-IP:8006
Home Assistant: http://TAILSCALE-IP:8123
Jellyfin:       http://TAILSCALE-IP:8096
```

Keep a simple list of service URLs somewhere you trust.

The pattern stays the same: connect to Tailscale, then use the private address.

---

## Next steps

Useful related guides:

- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)
- [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

Tailscale lets you reach Jellyfin remotely using a private address.

The basic flow is:

```text
Install Tailscale on server
Sign in and approve the server
Install Tailscale on client devices
Use http://TAILSCALE-IP:8096
Test from mobile data or another network
```

For most SmallGrid-style home servers, this is the clean default: private remote access, fewer moving parts, and a setup that is easier to maintain.
