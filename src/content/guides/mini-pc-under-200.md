---
title: "Budget Mini PC Home Lab: Picking a Tiny Box That Can Actually Homelab"
description: "How to choose a used or budget mini PC for a small efficient home lab, Jellyfin, Docker, Proxmox, backups, and low-power home server use."
pubDate: 2026-01-21
tags: ["hardware", "mini-pc", "low-power", "homelab"]
cover: "/images/guides/mini-pc-under-200-hero.webp"
---

## Goal

Pick a mini PC under about £200 that can:

- run Jellyfin
- host a few Docker services
- handle a light Proxmox setup
- stay quiet
- idle at low power
- avoid becoming another noisy desktop under the desk

This is not a shopping list. It is a practical checklist so you can judge used mini PCs on eBay, CEX, Facebook Marketplace, or wherever you are looking.

If you want a small efficient home lab, a used mini PC is usually the best first box: cheap to buy, cheap to run, quiet enough for a normal room, and powerful enough for the services most people actually use.

---

## The default recommendation

For a first SmallGrid-style homelab, buy boring used business hardware.

Good examples are small office mini PCs from Dell, HP, Lenovo, Fujitsu, or Intel NUC-style machines.

A sensible starting target is:

```text
CPU:      Intel 8th gen Core i5 or newer, or similar Ryzen
RAM:      16GB if possible
Storage:  256GB to 512GB SSD
Network:  Gigabit Ethernet
Power:    roughly 5W to 20W idle if well configured
```

Spend money on RAM, SSD, and backups before chasing flashy hardware.

For a broader equipment comparison, see [Recommended Home Lab Gear](/recommended-gear/).

---

## CPU and generation

For a low-power homelab box, start with:

- Intel 8th gen Core or newer
- AMD Ryzen 3000 mobile or newer

That usually gets you:

- decent performance per watt
- enough CPU for several small services
- better idle behaviour than old desktops
- useful integrated graphics for media tasks

Good rough options:

| CPU type | Good for |
|---|---|
| Intel i5 U-series | quiet Jellyfin and Docker box |
| Intel T-series desktop chip | small Proxmox node or heavier services |
| Ryzen 5 or Ryzen 7 mobile | general homelab use with good efficiency |
| Intel N100/N150-style systems | very low-power light services |

Avoid very old desktop hardware unless it is free or nearly free. An old tower can cost more in electricity than you saved buying it.

For measuring the difference, see [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/).

---

## RAM

Absolute minimum:

```text
8GB
```

Comfortable baseline:

```text
16GB
```

16GB is enough for:

- Jellyfin
- Tailscale
- a few Docker containers
- monitoring
- a small VM or LXC test environment

If the mini PC has two RAM slots, that is useful. You can start with one stick and upgrade later.

For Proxmox, 16GB is a much nicer starting point than 8GB.

---

## Storage

A good mini PC storage layout is simple:

```text
Internal SSD/NVMe: operating system, apps, VM disks, configs
External HDD/NAS:  bulk media, backups, archives
```

Do not force huge hard drives into a tiny box just because it looks neat.

Large drives can add:

- heat
- vibration
- noise
- power draw
- awkward cabling

A 256GB or 512GB SSD is fine for the operating system and services. Put large media libraries somewhere sensible.

For Jellyfin, the media can live on external storage as long as permissions are set correctly. See [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## Integrated graphics and Jellyfin

For Jellyfin, the integrated GPU can matter.

Intel Quick Sync is useful when Jellyfin needs to transcode video. But the better first target is direct play.

Direct play means the client plays the file directly and the server does much less work.

You do not need powerful hardware if:

- your clients can direct play your files
- most viewing happens at home
- you are not converting multiple streams at once

For the full explanation, see [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/).

---

## Ports and networking

Checklist:

- at least one Gigabit Ethernet port
- two or more USB ports
- HDMI or DisplayPort for emergency troubleshooting
- internal SSD support
- simple power brick or standard power supply

Wired Ethernet is strongly preferred for the main server.

Wi-Fi is fine for laptops and tablets. For the always-on box, use a cable if you can.

---

## Idle power and noise

A good mini PC often idles somewhere around:

```text
5W to 20W
```

Light normal use might be:

```text
15W to 35W
```

Do not obsess over peak power. Most home servers spend far more time idle or lightly loaded.

Noise matters too. A technically powerful mini PC is annoying if the fan constantly ramps up in the room where you work or sleep.

Practical noise tips:

- clean dust from used machines
- give the box airflow
- keep it off soft carpet
- use rubber feet or a mat if there is vibration
- avoid tiny overheating boxes with bad cooling

---

## Example good-enough specs

A good first mini PC might look like this:

```text
CPU:      Intel i5-8500T, i5-8250U, or newer equivalent
RAM:      16GB
Storage:  256GB or 512GB SSD
Network:  Gigabit Ethernet
Case:     small, vented, quiet fan
```

That is enough for:

- Jellyfin
- Tailscale
- a few Docker apps
- light monitoring
- a small Proxmox setup
- experiments and test VMs

If you want to run Proxmox from the start, read [Proxmox for Normal Humans: One-Node Starter Setup](/guides/proxmox-one-node-starter/).

---

## Things to watch out for in listings

### No RAM or no SSD

This can be fine if the price is low enough.

Just price the missing parts before buying.
