---
title: "Safe Experiments: Snapshots and Test Environments for Your Homelab"
description: "Use snapshots, test VMs, and simple clones so you can tinker without nuking your working setup."
pubDate: 2026-01-21
tags: ["testing", "snapshots", "proxmox", "homelab"]
---

## Goal

Be able to:

- try new things
- upgrade services
- change configs

…without the constant fear of “I’ve broken everything and I don’t remember what I did”.

---

## 1. The core idea: disposable copies

You want **something you can blow up** without consequences:

- a test VM
- a cloned container
- a snapshot you can roll back to

The live services should be **easy to revert** or **easy to recreate**.

---

## 2. Proxmox: snapshots and clones

### 2.1 Snapshots before upgrades

For VMs / containers with important services:

1. Shut down critical processes (optional but nice).
2. Create snapshot in Proxmox UI:
   - Select VM → Snapshots → Take Snapshot
   - Name it e.g. `pre-upgrade-2026-01-21`
3. Do your upgrade (OS, app, config).
4. If something goes badly wrong:
   - Revert snapshot.

CLI example:

```bash
# Snapshot VM 100
qm snapshot 100 pre-upgrade-2026-01-21
2.2 Full clones for big experiments
If you want to try something more invasive:

Shut down the VM/CT (or snapshot it).

Use Clone in the Proxmox UI:

Pick a new ID and name, e.g. core-services-test.

Start the clone and point it at:

different IP / network

or a private test network

Now you have a safe playground.

3. Docker: separate stacks for experiments
If you’re Docker-based:

Keep live services in one directory tree, e.g. /srv/docker/production

Use a parallel tree for experiments, e.g. /srv/docker/test

Example:

text
Copy code
/srv/docker/
  production/
    jellyfin/
    adguard/
    syncthing/
  test/
    jellyfin-next/
Test stack example:

bash
Copy code
mkdir -p /srv/docker/test/jellyfin-next
cd /srv/docker/test/jellyfin-next

cp /srv/docker/production/jellyfin/docker-compose.yml .

# Edit ports to avoid clashes, e.g. 8097 instead of 8096
# Then:
docker compose up -d
You can hit:

text
Copy code
http://YOUR-SERVER-IP:8097
…without touching the live one.

4. Config backups before changes
Before editing critical config files, take quick local backups:

bash
Copy code
sudo cp /etc/someapp/config.yml /etc/someapp/config.yml.bak-2026-01-21
Or use git in config directories:

bash
Copy code
cd /etc/someapp
sudo git init
sudo git add .
sudo git commit -m "Baseline config"
Then you can:

experiment

git diff to see what changed

git checkout to revert

5. Testing changes without upsetting the house
When you’re about to change something core (like DNS, router, Pi-hole):

Test on just your own device first:

Point your laptop/phone at the new DNS/IP.

Confirm things work.

Only then switch the router-level setting.

Same for:

new Jellyfin versions:

test in a clone or test container first

new reverse proxy setups:

test on a non-critical hostname/subdomain

6. A simple “change checklist”
Before a risky change:

Do I have:

a snapshot, or

a config backup, or

a cloned test environment?

Do I know how to roll back?

Is this a bad time for things to be broken?

After the change:

Does it work for you?

Does it work on another device?

Does it still work after a reboot?

7. Recap: SmallGrid safety-net rule
Experiments are good.

Experiments without a safety net are just outages.

Snapshots, clones, and config backups are cheap compared to re-installing everything at 11pm.

Your homelab should make you want to tinker more, not make you scared to touch it.