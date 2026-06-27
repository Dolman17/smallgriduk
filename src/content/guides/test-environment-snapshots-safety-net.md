---
title: "Safe Experiments: Snapshots and Test Environments for Your Homelab"
description: "Use snapshots, test VMs, and simple clones so you can tinker without breaking your working homelab."
pubDate: 2026-01-21
tags: ["testing", "snapshots", "proxmox", "homelab"]
cover: "/images/guides/snapshots-hero.svg"
---

## Goal

Be able to:

- try new things
- upgrade services
- change configs
- test risky ideas

without the constant fear of breaking the working setup.

The rule is simple: experiments are good, but experiments need a safety net.

---

## The core idea: disposable copies

Before changing something important, create something you can safely break.

That might be:

- a Proxmox snapshot
- a cloned VM
- a cloned LXC container
- a separate Docker test stack
- a backup copy of a config file

Your live services should be easy to revert or easy to recreate.

Snapshots are useful. They are not a replacement for backups.

---

## Proxmox snapshots before upgrades

For VMs and containers running important services, take a snapshot before upgrades or risky config changes.

In the Proxmox web interface:

1. Select the VM or container.
2. Go to **Snapshots**.
3. Click **Take Snapshot**.
4. Use a clear name, such as `pre-upgrade-2026-06-27`.
5. Make the change.
6. If it fails badly, roll back to the snapshot.

CLI example for VM `100`:

```bash
qm snapshot 100 pre-upgrade-2026-06-27
```

CLI example for container `101`:

```bash
pct snapshot 101 pre-upgrade-2026-06-27
```

Keep snapshot names boring and obvious. Future you should know exactly why the snapshot exists.

---

## Full clones for bigger experiments

Snapshots are good for quick rollback. Clones are better for bigger experiments.

Use a clone when you want to test something invasive, such as:

- a major application upgrade
- a new reverse proxy setup
- a new database version
- a different storage layout
- a replacement for a working service

In Proxmox:

1. Shut down the VM or container if practical.
2. Clone it.
3. Give the clone a clear name, such as `jellyfin-test` or `core-services-test`.
4. Start the clone on a different IP address or isolated network.
5. Test the change there first.

The point is not elegance. The point is avoiding an avoidable outage.

---

## Docker: separate stacks for experiments

If you use Docker, keep live services and test services in separate folders.

Example structure:

```text
/srv/docker/
  production/
    jellyfin/
    adguard/
    syncthing/
  test/
    jellyfin-next/
```

Create a test stack:

```bash
mkdir -p /srv/docker/test/jellyfin-next
cd /srv/docker/test/jellyfin-next
cp /srv/docker/production/jellyfin/docker-compose.yml .
```

Edit the test compose file so it does not clash with the live service.

For example, use port `8097` instead of `8096`.

Then start it:

```bash
docker compose up -d
```

Open the test service:

```text
http://YOUR-SERVER-IP:8097
```

Now you can test without touching the live Jellyfin instance.

---

## Config backups before changes

Before editing an important config file, make a backup copy.

Example:

```bash
sudo cp /etc/someapp/config.yml /etc/someapp/config.yml.bak-2026-06-27
```

If the change fails, restore it:

```bash
sudo cp /etc/someapp/config.yml.bak-2026-06-27 /etc/someapp/config.yml
sudo systemctl restart someapp
```

For more complex services, use Git inside the config directory.

Example:

```bash
cd /etc/someapp
sudo git init
sudo git add .
sudo git commit -m "Baseline config before changes"
```

Then you can inspect what changed:

```bash
sudo git diff
```

This is especially useful when a guide tells you to edit several lines and you want a clean way back.

---

## Test risky network changes on one device first

Some homelab changes can upset the whole house.

Examples:

- DNS changes
- Pi-hole or AdGuard Home changes
- router DHCP changes
- reverse proxy changes
- firewall rules
- Tailscale exit node changes

Do not switch the whole network first.

Test on one device:

1. Point your laptop or phone at the new DNS server.
2. Confirm normal browsing still works.
3. Confirm internal services still resolve.
4. Confirm streaming and work devices are unaffected.
5. Only then change the router-level setting.

This avoids turning a small experiment into a household support incident.

---

## Snapshots are not backups

A snapshot is useful when you make a change and need to roll back quickly.

A backup is useful when the disk dies, the host breaks, or the whole machine is lost.

Use both:

- snapshots before risky changes
- backups for anything you cannot recreate easily

For a practical backup model, see [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/).

---

## A simple change checklist

Before a risky change, ask:

- Do I have a snapshot?
- Do I have a config backup?
- Do I know how to roll back?
- Is this a bad time for things to break?
- Can I test this on a clone first?

After the change, check:

- Does it work on my device?
- Does it work on another device?
- Does it still work after a reboot?
- Did any unrelated service break?

If the answer is unclear, pause before making more changes.

---

## Good times to take snapshots

Take snapshots before:

- major package upgrades
- application version upgrades
- storage changes
- network changes
- database migrations
- reverse proxy changes
- authentication changes

Do not keep snapshots forever. They can consume storage and create a false sense of safety.

Keep the useful ones, remove the stale ones.

---

## Next steps

Useful related guides:

- [Proxmox One-Node Starter Guide](/guides/proxmox-one-node-starter/)
- [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)

---

## Recap

Experiments are good.

Experiments without a safety net are just outages.

Use snapshots for quick rollback, clones for bigger experiments, and backups for real recovery.

Your homelab should make you want to tinker more, not make you scared to touch it.
