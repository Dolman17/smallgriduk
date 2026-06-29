---
title: "Proxmox for Normal Humans: One-Node Starter Setup"
description: "A clean one-node Proxmox setup for small homelabs: simple layout, backups, test VMs, and low-power defaults."
pubDate: 2026-01-20
tags: ["proxmox", "virtualisation", "homelab", "low-power"]
cover: "/images/guides/proxmox-one-node-starter-hero.webp"
---

## Goal

Set up a single Proxmox node that can:

- run a few useful services
- stay simple and low-power
- keep the Proxmox host clean
- back up and restore VMs or containers
- give you a safe place to experiment

The aim is not to build a miniature data centre. The aim is one reliable box that makes your homelab easier to manage.

---

## The default recommendation

Start with one Proxmox node.

Do not build a cluster first. Do not split every tiny service into its own complicated pattern. Do not install lots of apps directly on the Proxmox host.

A good starter layout is:

```text
Proxmox host
  ├─ core-services VM
  ├─ test VM or container
  └─ backup storage
```

Keep the host boring. Put the interesting work inside VMs or containers.

---

## What you’ll need

Minimum sensible hardware:

- x86_64 Intel or AMD machine
- 8GB RAM minimum
- 16GB RAM or more if you want multiple VMs
- SSD or NVMe boot drive
- wired Ethernet
- another computer with a browser

Nice to have:

- second disk for backups or VM storage
- UPS if power cuts are common
- a low-power mini PC if this will run all day

For hardware guidance, see [Mini PCs Under £200: Picking a Tiny Box That Can Actually Homelab](/guides/mini-pc-under-200/).

---

## Step 1: Install Proxmox VE

Download the Proxmox VE ISO from the Proxmox website.

Write it to a USB stick using a tool such as Rufus, Ventoy, or BalenaEtcher.

Then:

1. Boot the server from the USB stick.
2. Choose **Install Proxmox VE**.
3. Accept the licence.
4. Choose the install disk.
5. Set country, time zone, and keyboard.
6. Set a strong root password.
7. Set the management network details.

A static IP is ideal if your network allows it.

After installation, the server will reboot and show a management URL similar to:

```text
https://192.168.1.50:8006
```

Use your own Proxmox IP, not the example address.

---

## Step 2: Log in and update Proxmox

From another computer on the same network, open:

```text
https://YOUR-PROXMOX-IP:8006
```

You may see a browser certificate warning. That is normal for a new Proxmox install using its default certificate.

Log in with:

```text
User: root
Password: the password you set during install
Realm: Linux PAM standard authentication
```

Update the host from the shell.

```bash
ssh root@YOUR-PROXMOX-IP
apt update
apt full-upgrade -y
reboot
```

After the reboot, log back into the web interface.

---

## Step 3: Keep the host lean

Treat Proxmox as the foundation, not the app server.

The host should mainly:

- manage VMs and containers
- handle storage
- handle networking
- run Proxmox backups

Avoid installing everyday services directly on the Proxmox host.

For example, avoid putting Jellyfin, Home Assistant, Docker apps, and monitoring tools directly on the host. Put them inside a VM or container instead.

This makes upgrades, snapshots, backups, and restores easier to reason about.

---

## Step 4: Understand the storage layout

A basic Proxmox install usually creates storage entries such as:

```text
local       ISO images, container templates, backups if enabled
local-lvm   VM and container disks
```

Some installs use ZFS instead of LVM, depending on what you selected during installation.

For a simple starter setup, this is fine:

```text
System SSD/NVMe: Proxmox and VM disks
Second disk:     backups or extra VM storage
External/NAS:    optional backup target
```

In the Proxmox web UI:

1. Select your node.
2. Open **Disks**.
3. Confirm the disks look correct.
4. Open **Datacenter → Storage**.
5. Check which storage locations allow VM disks, ISO images, and backups.

Do not redesign storage on day one unless you have a clear reason.

---

## Step 5: Create a core services VM

A core services VM is a simple place to run the apps you actually use.

Examples:

- Jellyfin
- Docker Compose apps
- Home Assistant
- AdGuard Home or Pi-hole
- Syncthing
- small monitoring tools

### Upload an Ubuntu Server ISO

In the Proxmox web UI:

1. Select your node.
2. Open **local → ISO Images**.
3. Click **Upload**.
4. Upload the Ubuntu Server ISO.

### Create the VM

Click **Create VM** and use sensible starter settings:

```text
Name:      core-services
CPU:       2 to 4 cores
Memory:    4GB to 8GB
Disk:      40GB to 80GB
Network:   default bridge, usually vmbr0
```

Install Ubuntu Server inside the VM as normal.

Once installed, give the VM a predictable IP address, either through your router’s DHCP reservation feature or inside the VM.

---

## Step 6: Set up the VM basics

SSH into the VM:

```bash
ssh user@CORE-VM-IP
```

Update packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git htop
```

From here, this VM can become your main service box.

If you are starting with Jellyfin, use [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/).

If you want private remote access, see [Remote Jellyfin with Tailscale: Private Access Setup](/guides/jellyfin-tailscale-remote-access/).

---

## Step 7: Use containers when they make sense

Proxmox can run both VMs and LXC containers.

A simple rule:

| Option | Good for | Trade-off |
|---|---|---|
| VM | Strong isolation, full OS, Docker hosts | Uses more RAM and disk |
| LXC container | Lightweight Linux services | Slightly more host-coupled |

For beginners, a VM is often easier to understand.

Once you are comfortable, LXC containers are useful for small services such as DNS, monitoring, or lightweight web tools.

Do not worry about the perfect choice. A working service in a VM is better than a theoretical perfect design that never gets finished.

---

## Step 8: Add backups early

Backups are where Proxmox becomes genuinely useful.

You can back up entire VMs and containers from the web interface.

Choose a backup target, such as:

- a second local disk
- a NAS share
- an external disk
- Proxmox Backup Server later, if you want to level up

In the web UI:

1. Go to **Datacenter → Storage → Add**.
2. Choose **Directory**, **NFS**, or another suitable type.
3. Point it at the backup path or share.
4. Make sure **VZDump backup file** is enabled for that storage.

Then create a backup job:

1. Go to **Datacenter → Backup**.
2. Click **Add**.
3. Select the backup storage.
4. Pick a schedule, such as daily at 03:00.
5. Include your important VMs and containers.
6. Use `zstd` compression as a sensible default.

For a wider backup strategy, see [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/).

---

## Step 9: Test a restore

A backup is only useful if you can restore it.

Test with a small VM or container first.

In the Proxmox web UI:

1. Go to **Datacenter → Backup**.
2. Select a backup.
3. Click **Restore**.
4. Restore to a different VM ID so you do not overwrite the original.
5. Boot the restored copy.
6. Confirm the service works.

If the restored VM boots and the service works, your backup process is real.

---

## Step 10: Use snapshots before risky changes

Snapshots are useful before changes such as:

- package upgrades
- application upgrades
- config changes
- storage changes
- network changes

Create a VM snapshot from the command line:

```bash
qm snapshot 100 pre-upgrade-2026-06-27
```

Create a container snapshot:

```bash
pct snapshot 101 pre-upgrade-2026-06-27
```

Snapshots are not backups. They are short-term rollback points.

For the full comparison, see [Proxmox Snapshots vs Backups: What Beginners Get Wrong](/guides/proxmox-snapshots-vs-backups/).

For a fuller experiment workflow, see [Safe Experiments: Snapshots and Test Environments for Your Homelab](/guides/test-environment-snapshots-safety-net/).

---

## Common mistakes

### Installing everything on the Proxmox host

This makes future upgrades and restores harder.

Keep apps inside VMs or containers.

### Skipping backups until later

Later usually means after something has already gone wrong.

Create a backup job early, even if it is not perfect.

### Building a cluster too soon

A single reliable node is enough for most home setups.

Learn backup and restore before clustering.

### Keeping old snapshots forever

Snapshots can consume storage and complicate disk usage.

Keep them short-term and remove stale ones.

---

## Next steps

Useful related guides:

- [Mini PCs Under £200: Picking a Tiny Box That Can Actually Homelab](/guides/mini-pc-under-200/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)
- [Proxmox Snapshots vs Backups: What Beginners Get Wrong](/guides/proxmox-snapshots-vs-backups/)
- [Safe Experiments: Snapshots and Test Environments for Your Homelab](/guides/test-environment-snapshots-safety-net/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)

---

## Recap

A good first Proxmox setup is simple:

```text
One node
One core services VM
A clean host
Automated backups
Tested restores
Snapshots before risky changes
```

That gives you a practical homelab foundation without turning the setup into a maintenance project.
