---
title: "Proxmox for Normal Humans: One-Node Starter Setup"
description: "A clean one-node Proxmox setup for small homelabs: simple layout, backups, and low-power defaults."
pubDate: 2026-01-20
tags: ["proxmox", "virtualisation", "homelab", "low-power"]
---

## Goal

Set up a **single Proxmox node** that can:

- run a few services (Jellyfin, Home Assistant, Pi-hole, etc.)
- stay low-power and quiet
- be backed up and restored without wizardry

…and **not** turn into a “what does this random service do?” science experiment.

---

## The SmallGrid layout

We’re aiming for:

- **1 node** (don’t overthink clusters)
- **1 “core services” VM** (or a small set of VMs/containers)
- **Backups** to an external disk or NAS
- A host that stays **lean and boring** (all the fun lives in VMs/containers)

High level:

- Proxmox host: “hypervisor” only  
- VM #1: main services (Docker/containers or classic services)  
- Optional: VM #2 for experiments so you don’t break production  

---

## What you’ll need

- A machine that can run Proxmox VE:
  - x86_64 CPU (Intel/AMD)
  - 8–16 GB RAM minimum (more is nicer)
  - SSD/NVMe for system + VM storage
- A wired network connection
- Another device with a web browser on the same LAN

Optional but ideal:

- A second disk (for backups or extra VM storage)
- A UPS if your power is flaky

---

## 1. Install Proxmox VE

### 1.1 Download and write the ISO

Go to the Proxmox website and download the latest **Proxmox VE ISO**.

Use your favourite tool (Rufus / Ventoy / BalenaEtcher) to write it to a USB stick, then:

1. Boot your server from the USB
2. Choose **“Install Proxmox VE”**

Follow the installer steps:

- Accept the license
- Choose the install disk (usually your main SSD)
- Set:
  - Country / time zone / keyboard
  - **Strong root password**
  - Email address (for alerts)
- Set the **management IP** (static is best if your network allows it)

After installation, the server reboots and you’ll see a console with a URL like:

- `https://192.168.1.50:8006`

---

## 2. First login and basic updates

From another machine on the same LAN, open:

- `https://YOUR-PROXMOX-IP:8006`

You’ll get a browser warning about a self-signed cert. Continue anyway (you can fix certificates later).

Log in as:

- **User:** `root`
- **Password:** the one you set during install

You’ll see the Proxmox web UI.

### 2.1 Update Proxmox

You can update from the web UI, but it’s often clearer via SSH.

On your machine:

~~~bash
ssh root@YOUR-PROXMOX-IP
~~~

Once in:

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">Update Proxmox packages</div>
  </div>

  <pre><code># Refresh package lists
# (you may see enterprise repo warnings if you don't have a subscription)
$ apt update

# Upgrade packages
$ apt full-upgrade -y

# Reboot if the kernel was updated
$ reboot</code></pre>
</div>

Log back into the web UI after the reboot.

---

## 3. Keep the host lean (SmallGrid rule)

Proxmox is the *hypervisor*, not your app server.

So:

- Don’t install random services on the Proxmox host
- Don’t run Docker directly on the host
- Don’t treat it like a normal Ubuntu server

Use VMs or containers for workloads. The host should basically just:

- manage VMs/containers
- handle storage + networking
- run backups

Think of it as the “boring and reliable foundation”.

---

## 4. Storage layout: simple, not fancy

For a starter setup:

- **Local system disk**: Proxmox + VM storage
- Optional **second disk**:
  - extra VM storage **or**
  - backup target

From the Proxmox web UI:

1. Click your node (left sidebar)
2. Go to **Disks** → make sure disks look as expected
3. Go to **Datacenter → Storage** to see storage pools

A simple layout:

- `local` – for ISO images and templates
- `local-lvm` or `local-zfs` – for VM disks

You can create an extra **Directory** storage on a second disk if you want a place for backups or container data.

---

## 5. Create your “core services” VM

We’ll create one VM to hold your main services.

### 5.1 Upload an ISO

1. In the left sidebar, click your **node**
2. Go to **local → ISO Images**
3. Click **Upload** and upload an Ubuntu Server ISO (or your preferred distro)

### 5.2 Create the VM

1. Click **Create VM** (top right of the UI)
2. Give it a name, e.g. `core-services`
3. Choose the ISO you uploaded as the install media
4. Set:
   - **System**: default is usually fine
   - **Disks**: e.g. 40–80 GB as a starting point
   - **CPU**: 2–4 cores
   - **Memory**: 4–8 GB for a mixed-services box
   - **Network**: default bridge (`vmbr0`) is fine

Finish and start the VM.

Open the **Console** tab and install the OS as you would on bare metal.

---

## 6. SSH into the VM and set it up

Once the VM OS is installed and booted, ensure it has:

- a static IP (via your DHCP server or inside the VM)
- SSH server installed

From your main machine:

~~~bash
ssh user@CORE-VM-IP
~~~

Do your usual base setup:

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">Initial VM configuration</div>
  </div>

  <pre><code>$ sudo apt update
$ sudo apt upgrade -y

# Install some basics
$ sudo apt install -y htop git curl</code></pre>
</div>

From here, this VM can become your **“everything server”**:

- Docker/Compose for apps  
- Jellyfin, Home Assistant, Pi-hole, etc.  
- Tailscale for secure remote access  

You can keep adding services, and if you ever need to move them, you move the **VM**, not the host.

---

## 7. Optional: use containers (LXC) for lightweight services

If you’d rather split things up:

- Use one LXC container for each service class (e.g. `media`, `monitoring`, `dns`), or
- One “core” container and one “playground” container

From the Proxmox UI:

1. Go to **Create CT**
2. Choose a template (Debian/Ubuntu templates can be downloaded from the **Templates** tab under a storage)
3. Assign CPU/RAM
4. Give it a static IP (or DHCP)

Containers are lighter than VMs, but don’t isolate as strongly. For most homelabs, they’re perfectly fine.

---

## 8. Backups (don’t skip this)

This is where Proxmox shines: you can back up entire VMs and containers.

### 8.1 Set up backup storage

Pick somewhere for backups to live:

- A **second local disk** mounted as a directory storage  
- A **NAS share** mounted via NFS/CIFS  

In the web UI:

1. Go to **Datacenter → Storage → Add**
2. Choose **Directory** or **NFS**
3. Point it at your backup path/share
4. Tick **VZDump backup file** so it can hold backups

### 8.2 Create a backup job

1. Go to **Datacenter → Backup**
2. Click **Add**
3. Select:
   - **Storage**: the backup storage you just added
   - **Schedule**: e.g. `daily` at 03:00
   - **Selection mode**: `include` and pick your core VM/CTs
   - Compression: `zstd` is a good default

Save it.

Proxmox will now create scheduled backups of your VM/containers to that storage.

---

## 9. Test a restore (future-you will thank you)

Backups are only real once you’ve restored from them.

### 9.1 Test restore to a different ID

Pick a smaller VM or container for the test.

1. Go to **Datacenter → Backup**
2. Click on a backup in the list
3. Click **Restore**
4. Choose:
   - A **different ID** (so you don’t overwrite the live one)
   - The same node
5. Restore and boot the test copy

If the test VM/container boots and the app works, you’ve proven your backup pipeline.

---

## 10. Recap: the one-node Proxmox pattern

If you’ve followed along, you now have:

- A **single Proxmox node** on your network
- A **core services VM** (or a small set of VMs/containers)
- A storage layout that isn’t overcomplicated
- **Automated backups** to a separate storage
- At least one **tested restore**

From here you can:

- add more VMs/containers as needed  
- snapshot before upgrades  
- migrate to a nicer box later by backing up/restoring VMs  

All without your homelab turning into a pile of half-remembered installs on bare metal.  
This is Proxmox for normal humans, not data-centre cosplay.
```
