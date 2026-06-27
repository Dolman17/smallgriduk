---
title: "Backups That Don’t Lie: 3-2-1 for Home Servers"
description: "A simple home server backup strategy built around 3-2-1, automatic copies, offsite protection, and tested restores."
pubDate: 2026-01-20
tags: ["backups", "security", "homelab"]
cover: "/images/guides/backups-hero.svg"
---

## Goal

Build a backup plan that:

- protects important files
- survives disk failure
- gives you a way back after mistakes
- includes at least one offsite copy
- proves itself with restore tests

The focus is restores, not backup theatre.

If you have never restored from it, it is not a backup. It is a hope.

---

## The default recommendation

Start simple:

```text
Primary copy:   live data on your server
Second copy:    local USB disk or another local machine
Third copy:     cloud storage or rotated disk kept elsewhere
```

That is the home-server version of 3-2-1:

- **3 copies** of important data
- **2 different storage locations or media**
- **1 copy away from the main server**

You do not need a perfect setup on day one.

Start with one local backup that runs automatically. Then add the offsite copy.

---

## What actually needs backing up?

Not everything deserves the same effort.

### High priority

Back these up properly:

- photos
- documents
- personal projects
- password vault exports or recovery codes
- service configuration
- Docker Compose files
- scripts you rely on
- Proxmox backup files or VM configs

### Medium priority

Useful, but not always critical:

- Jellyfin metadata
- watch history
- application databases
- monitoring history
- notes and documentation

### Low priority

Usually replaceable:

- downloaded installers
- temporary files
- Linux ISOs
- media you can recreate or re-rip

SmallGrid rule: back up what hurts to lose first.

---

## Example backup layout

A practical home server layout might look like this:

```text
/srv/data/               live important data
/mnt/backup/data/        local USB backup copy
cloud or rotated disk    offsite copy
```

This guide uses these example paths:

```text
Source:      /srv/data/
Local backup /mnt/backup/data/
Log file:    /var/log/backup-data.log
```

Change the paths to match your own server.

---

## Step 1: Prepare a local backup disk

First, identify the backup disk.

```bash
lsblk -o NAME,SIZE,MODEL,MOUNTPOINT
```

Be careful. Formatting the wrong disk destroys data.

After you have identified the correct disk, create a filesystem if needed.

Example only:

```bash
sudo mkfs.ext4 /dev/sdX
sudo e2label /dev/sdX BACKUP1
```

Replace `/dev/sdX` with the actual backup disk.

Create a mount point:

```bash
sudo mkdir -p /mnt/backup
sudo mount /dev/sdX /mnt/backup
```

For a permanent setup, mount by UUID in `/etc/fstab` rather than relying on `/dev/sdX` staying the same.

Check UUIDs with:

```bash
blkid
```

---

## Step 2: Create a local backup script

Create the script:

```bash
sudo nano /usr/local/sbin/backup-data.sh
```

Paste this:

```bash
#!/usr/bin/env bash
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

echo "$(timestamp) - Backup finished" | tee -a "$LOG"
```

Make it executable:

```bash
sudo chmod +x /usr/local/sbin/backup-data.sh
```

Run it once manually:

```bash
sudo /usr/local/sbin/backup-data.sh
```

Check the result:

```bash
ls -la /mnt/backup/data
sudo tail -n 50 /var/log/backup-data.log
```

---

## Step 3: Schedule the local backup

Edit root’s crontab:

```bash
sudo crontab -e
```

Add a nightly backup job:

```cron
# Run local backup every day at 02:30
30 2 * * * /usr/local/sbin/backup-data.sh
```

Now you have an automatic second copy on another disk.

That is not the full 3-2-1 setup yet, but it is already better than hoping the main disk never fails.

---

## Step 4: Add an offsite copy

An offsite copy protects you from problems that affect the server and the local backup at the same time.

Practical options:

- cloud backup using `restic`, `borg`, or `rclone`
- a USB disk rotated to another location
- another machine in a trusted location
- object storage used only for encrypted backups

For a simple start, use either:

```text
Local USB backup every night
Offsite backup weekly or monthly
```

or:

```text
Local USB backup every night
Rotated USB disk once a month
```

The important part is that at least one copy is away from the main server.

---

## Step 5: Example offsite backup with restic

This example uses `restic` because it supports encryption and snapshots.

Install it:

```bash
sudo apt update
sudo apt install -y restic
```

Create an environment file:

```bash
sudo nano /root/.restic-env
```

Example content:

```bash
export RESTIC_REPOSITORY="s3:https://YOUR-S3-ENDPOINT/YOUR-BUCKET"
export RESTIC_PASSWORD="choose-a-strong-password"
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
```

Protect the file:

```bash
sudo chmod 600 /root/.restic-env
```

Initialise the repository:

```bash
sudo -i
source /root/.restic-env
restic init
exit
```

Create the offsite backup script:

```bash
sudo nano /usr/local/sbin/backup-offsite.sh
```

Paste this:

```bash
#!/usr/bin/env bash
set -euo pipefail

source /root/.restic-env

SRC="/srv/data"
LOG="/var/log/backup-offsite.log"

echo "$(date) - Starting offsite backup of ${SRC}" | tee -a "$LOG"

restic backup "$SRC" --verbose | tee -a "$LOG"

echo "$(date) - Pruning old snapshots" | tee -a "$LOG"

restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune | tee -a "$LOG"

echo "$(date) - Offsite backup finished" | tee -a "$LOG"
```

Make it executable:

```bash
sudo chmod +x /usr/local/sbin/backup-offsite.sh
```

Run it manually first:

```bash
sudo /usr/local/sbin/backup-offsite.sh
```

Then schedule it:

```bash
sudo crontab -e
```

Example monthly job:

```cron
# Run offsite backup on the 1st of each month at 03:30
30 3 1 * * /usr/local/sbin/backup-offsite.sh
```

If your important data changes often, run the offsite backup weekly instead.

---

## Step 6: Test a local restore

Pick a non-critical folder or a small test file.

Do not test restores for the first time during a real emergency.

Example restore from the local backup:

```bash
sudo rsync -avh /mnt/backup/data/projects/example/ /srv/data/projects/example/
```

Check:

- did the files come back?
- do permissions look sensible?
- can the application still read them?

If yes, your local backup is more than a checkbox.

---

## Step 7: Test an offsite restore

With `restic`, list snapshots:

```bash
sudo -i
source /root/.restic-env
restic snapshots
```

Restore a small test folder into a temporary location:

```bash
restic restore latest --target /tmp/restic-restore-test --include "/srv/data/projects/example"
ls -R /tmp/restic-restore-test
exit
```

If you can see and use the restored files, your offsite copy is working.

Clean up the test folder after checking it:

```bash
sudo rm -rf /tmp/restic-restore-test
```

---

## Backup checklist

You are in decent shape if you can answer yes to these:

- [ ] I know where my important data lives.
- [ ] I have a local backup disk or local backup target.
- [ ] Backups run automatically.
- [ ] I have at least one copy away from the main server.
- [ ] I have restored at least one test file or folder.
- [ ] I know how to rebuild the service if the server dies.
- [ ] Backup logs are somewhere I can check.

---

## Common mistakes

### Backing up only the easy stuff

Media is obvious because it is large. Config is easy to forget because it is small.

Do not forget service config, Compose files, scripts, and notes.

### Keeping the backup disk plugged in forever

A permanently attached backup disk is convenient, but it can be affected by some of the same problems as the server.

That is why the offsite or rotated copy matters.

### Never checking logs

A backup job that silently fails is worse than no backup because it gives false confidence.

Check logs occasionally:

```bash
sudo tail -n 100 /var/log/backup-data.log
sudo tail -n 100 /var/log/backup-offsite.log
```

### Never testing restore

A restore test is the difference between a real backup and wishful thinking.

---

## Next steps

Useful related guides:

- [Safe Experiments: Snapshots and Test Environments for Your Homelab](/guides/test-environment-snapshots-safety-net/)
- [Proxmox for Normal Humans: One-Node Starter Setup](/guides/proxmox-one-node-starter/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)
- [Mini PCs Under £200: Picking a Tiny Box That Can Actually Homelab](/guides/mini-pc-under-200/)

---

## Recap

A practical 3-2-1 backup setup is:

```text
Live data on the server
Local automatic backup
Offsite or rotated copy
Regular restore tests
```

Start with a nightly local backup. Then add the offsite copy. Then prove the whole thing by restoring a small folder.

Your future self will not care which backup tool you chose. They will care whether the files come back.
