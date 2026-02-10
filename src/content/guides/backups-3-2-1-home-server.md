---
title: "Backups That Don’t Lie: 3-2-1 for Home Servers"
description: "A simple backup strategy for homelabs that focuses on restores, not vibes."
pubDate: 2026-01-20
tags: ["backups", "security", "homelab"]
cover: "/images/guides/backups-hero.svg"
---

## Goal

Give your homelab a backup plan that:

- survives disk failures and user mistakes  
- doesn’t require a degree in ZFS arcana  
- is simple enough that you’ll actually keep it running  

The focus is **restores**, not vibes.

---

## 3-2-1 in one minute

The classic rule:

- **3 copies** of your data  
- **2 different media** (e.g. disk + cloud, or disk + NAS)  
- **1 offsite** (not in the same building)  

Translated for a home server, that becomes something like:

- live data on your server/NAS  
- a second copy on a local USB disk or another machine  
- a third copy in the cloud or on a drive that lives somewhere else  

---

## What actually needs backing up?

Not everything is equally precious.

**High priority (must survive):**

- Photos, documents, personal projects  
- Password vaults, 2FA backup codes  
- App configs you’d hate to recreate (Proxmox config, Docker compose, etc.)  

**Medium priority (nice to have):**

- Media library metadata (Jellyfin DB, watch history)  
- Small config files and scripts  

**Low priority (replaceable):**

- Linux ISOs  
- Downloaded installers  
- Movies/TV you can re-rip or re-download if the worst happens  

SmallGrid rule: **be ruthless** — backing up 1–2 TB of precious stuff is fine; 40 TB of “might watch again” usually isn’t.

---

## The SmallGrid 3-2-1 layout (practical)

A simple pattern you can adopt or adapt:

- **Primary:** your server/NAS (e.g. `/srv/data`, `/mnt/pool`)  
- **Secondary:** a USB backup disk plugged into the server (nightly backup)  
- **Offsite:** monthly backup to cloud storage or a rotated USB disk you keep elsewhere  

You don’t need to start perfect. Start with **Primary + Secondary**, then add offsite when you’re ready.

---

## 1. Local backup to USB disk (nightly)

We’ll assume:

- your data lives at `/srv/data`  
- your USB backup disk is mounted at `/mnt/backup`  
- you’re on Ubuntu or a similar Linux distro  

### 1.1 Label and mount the backup disk

Format the disk (danger: this wipes it):

~~~bash
sudo lsblk
# Identify the right disk (e.g. /dev/sdb)

sudo mkfs.ext4 /dev/sdX   # replace sdX with your actual device
sudo e2label /dev/sdX BACKUP1
~~~

Create a mount point and mount it:

~~~bash
sudo mkdir -p /mnt/backup
sudo mount /dev/sdX /mnt/backup
~~~

Optional (recommended): add an `/etc/fstab` entry using the disk’s UUID so it auto-mounts on boot.

---

### 1.2 Create a simple backup script

Use `rsync` for a straightforward snapshot-style backup.

Create `/usr/local/sbin/backup-data.sh`:

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">/usr/local/sbin/backup-data.sh</div>
  </div>

  <pre><code>#!/usr/bin/env bash
set -euo pipefail

SRC="/srv/data/"
DEST="/mnt/backup/data"
LOG="/var/log/backup-data.log"

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

echo "$(timestamp) - Starting backup from ${SRC} to ${DEST}" | tee -a "$LOG"

rsync -avh --delete \
  --exclude=".cache" \
  --exclude="*.tmp" \
  "$SRC" "$DEST" | tee -a "$LOG"

echo "$(timestamp) - Backup finished" | tee -a "$LOG"</code></pre>
</div>

Make it executable:

~~~bash
sudo chmod +x /usr/local/sbin/backup-data.sh
~~~

**What this does:**

- copies everything from `/srv/data/` to `/mnt/backup/data/`  
- removes files on the backup that were deleted from the source (`--delete`)  
- logs to `/var/log/backup-data.log`  

---

### 1.3 Schedule it nightly (cron)

Edit root’s crontab:

~~~bash
sudo crontab -e
~~~

Add:

~~~cron
# Run backup every day at 02:30
30 2 * * * /usr/local/sbin/backup-data.sh
~~~

Now you’ve got an automatic **second copy** on a different disk.

---

## 2. Offsite backup (monthly, minimum)

This is the part that saves you from:

- fire / theft  
- “oops, I knocked the server and backup disk off the same shelf”  

Two practical options:

1. **Cloud backup tool** (e.g. restic, borg + remote repo, rclone to object storage)  
2. **Rotated USB disk** you plug in once a month and store elsewhere  

### 2.1 Example: offsite with `restic` + cloud storage

We’ll keep it generic; you plug in your provider details.

Set environment variables (e.g. in `/root/.restic-env`):

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">/root/.restic-env</div>
  </div>

  <pre><code>export RESTIC_REPOSITORY="s3:https://YOUR-S3-ENDPOINT/YOUR-BUCKET"
export RESTIC_PASSWORD="choose-a-strong-password"
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"</code></pre>
</div>

Source it and initialise the repo:

~~~bash
sudo -i
source /root/.restic-env
restic init
exit
~~~

Create `/usr/local/sbin/backup-offsite.sh`:

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">/usr/local/sbin/backup-offsite.sh</div>
  </div>

  <pre><code>#!/usr/bin/env bash
set -euo pipefail

source /root/.restic-env

SRC="/srv/data"
LOG="/var/log/backup-offsite.log"

echo "$(date) - Starting offsite backup of ${SRC}" | tee -a "$LOG"

restic backup "$SRC" --verbose | tee -a "$LOG"

echo "$(date) - Pruning old snapshots" | tee -a "$LOG"

restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 | tee -a "$LOG"

echo "$(date) - Offsite backup finished" | tee -a "$LOG"</code></pre>
</div>

Make it executable:

~~~bash
sudo chmod +x /usr/local/sbin/backup-offsite.sh
~~~

Schedule it monthly (or weekly if your data changes a lot):

~~~bash
sudo crontab -e
~~~

Add:

~~~cron
# Run offsite backup on the 1st of each month at 03:30
30 3 1 * * /usr/local/sbin/backup-offsite.sh
~~~

Now you’ve got an **offsite copy** automatically maintained.

---

## 3. The only rule that matters: test restores

If you’ve never restored from it, it isn’t a backup. It’s a hope.

### 3.1 Test a local restore

Pick a **non-critical** folder or a couple of files.

1. Copy them somewhere safe temporarily.  
2. Delete them from `/srv/data/...`.  
3. Restore from `/mnt/backup/data/...`.  

Example:

~~~bash
# Example: restore a single folder
sudo rsync -avh /mnt/backup/data/projects/example/ /srv/data/projects/example/
~~~

Check:

- do the files come back?  
- do permissions look sane?  

If yes, you’ve just proven the local backup works.

---

### 3.2 Test an offsite restore (dry run first)

With `restic`, list snapshots:

~~~bash
sudo -i
source /root/.restic-env
restic snapshots
~~~

Restore a small test folder into a temporary path:

~~~bash
restic restore latest --target /tmp/restic-restore-test --include "/srv/data/projects/example"
ls -R /tmp/restic-restore-test
exit
~~~

If you can see and use the files, your offsite backup is more than a checkbox.

---

## 4. Backup checklist (SmallGrid edition)

You’re in decent shape if you can answer **yes** to most of these:

- [ ] I know **where** my important data lives (paths written down).  
- [ ] I have a **local backup disk** and it’s actually mounted.  
- [ ] Backups run **automatically** (cron/systemd timers).  
- [ ] I have an **offsite copy** (cloud or rotated drive).  
- [ ] I have successfully restored at least **one test folder**.  
- [ ] I know how to restore the **whole thing** if the server dies.  

---

## 5. Start small, then level up

Don’t wait for the “perfect” setup:

1. Get a single USB disk + nightly `rsync` working.  
2. Add offsite when you’re comfortable.  
3. Iterate: split out important data, add configs, refine retention.  

Your future self, staring at a dead disk, will not care which backup tool you chose — only whether you can bring your data back. This plan makes “yes” the default.  
