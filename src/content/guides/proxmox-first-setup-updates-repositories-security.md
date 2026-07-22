---
title: "Proxmox First Setup: Updates, Repositories and Basic Security"
description: "Configure a new Proxmox VE host safely: check repositories, install updates, review access, enable two-factor authentication and verify the host after reboot."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "virtualisation", "homelab", "home-server", "security", "updates"]
---

## Quick answer

After installing Proxmox VE, do these jobs before creating important guests:

1. Record the installed version and current network state.
2. Choose either the enterprise repository or the no-subscription repository.
3. Refresh package information and install all available updates.
4. Reboot if the kernel or other core packages changed.
5. Confirm the web interface, network and storage return normally.
6. Create a named administrator account and protect it with two-factor authentication.
7. Check time synchronisation, email notifications, firewall planning and backups.

Do not paste repository commands written for an older major release into Proxmox VE 9. Repository formats and Debian codenames change.

This guide follows the current Proxmox VE 9 documentation. SmallGrid had not completed these steps on its intended host when this article was published, so the procedure is not presented as a tested SmallGrid result.

Start with [How to Install Proxmox VE: Complete Beginner Guide](/guides/how-to-install-proxmox-ve/).

---

## 1. Capture the starting state

Open **Node → Shell** and run:

```bash
pveversion -v
ip -brief address
ip route
cat /etc/network/interfaces
lsblk -o NAME,MODEL,SIZE,FSTYPE,MOUNTPOINTS
systemctl --failed
```

Save the output privately. It gives you a before-and-after record if an update exposes a problem.

Also check that the host name resolves to its management address:

```bash
hostname --fqdn
getent hosts "$(hostname --fqdn)"
```

Fix name resolution before building guests. Proxmox depends on consistent host naming and network configuration.

## 2. Understand the repository choices

Proxmox provides different package repositories:

| Repository | Use it when |
|---|---|
| Enterprise | The host has a valid subscription and you want the most heavily tested package stream |
| No-subscription | A home lab has no subscription and accepts a less conservative package stream |
| Test | You are deliberately testing newer packages and can recover from breakage |

The no-subscription repository is not the same as a paid support service. It is suitable for many home labs, but you still need verified backups and a recovery plan.

Avoid the test repository on a host carrying services you care about.

## 3. Configure repositories in the web interface

In the Proxmox web interface:

1. Select the node.
2. Open **Updates → Repositories**.
3. Review every configured entry and its status.
4. If you have a subscription, keep the enterprise repository enabled.
5. If you do not have a subscription, disable the enterprise entry and add the current **No-Subscription** repository through the interface.
6. Do not remove the normal Debian sources required by the host.

The interface reduces the chance of copying an old suite name or malformed source line. Compare the result with the current [Proxmox package repository documentation](https://pve.proxmox.com/pve-docs/pve-package-repos.html).

Record which repository was enabled and why.

Do not use a script whose main purpose is to hide the subscription notice. The notice does not prevent an unsubscribed home lab from using Proxmox, and changing packaged interface files adds needless maintenance risk.

## 4. Refresh and install updates

Use **Node → Updates**, select **Refresh**, inspect the package list, then choose **Upgrade**. The upgrade opens a console so you can read prompts and errors.

The shell equivalent is:

```bash
apt update
apt full-upgrade
```

Read the proposed actions before confirming. Stop and investigate if APT wants to remove core Proxmox packages or reports broken dependencies.

After the upgrade:

```bash
pveversion -v
apt list --upgradable
systemctl --failed
journalctl -p err -b --no-pager
```

An empty `apt list --upgradable` result is useful evidence, but it does not prove the host will return after reboot.

## 5. Reboot and verify

If a new kernel or important system package was installed, perform a controlled reboot while you still have local-console access:

```bash
reboot
```

When it returns, check:

```bash
uptime
uname -r
pveversion -v
ip -brief address
ip route
systemctl --failed
systemctl status pveproxy --no-pager
```

Confirm that:

- the web interface opens at the same address
- the expected storage is available
- DNS resolution works
- the task log shows no unexplained failure
- the host time is correct

Keep a monitor and keyboard available until this has passed.

## 6. Create a named administrator

Using `root` for initial recovery is normal, but daily administration is easier to audit with a named account.

In **Datacenter → Permissions → Users**, create a user in the appropriate realm. Then add only the permissions that account needs through **Datacenter → Permissions**.

For a single trusted administrator, the built-in Administrator role at `/` provides full control. It is powerful: do not assign it to ordinary users or service accounts.

Test the named account in a separate private browser window before changing how you use `root`. Keep a documented local recovery method.

## 7. Enable two-factor authentication

Protect administrative accounts with two-factor authentication from **Datacenter → Permissions → Two Factor** or the user account menu, depending on the method being configured.

Before logging out:

- enrol the authenticator
- complete a test login
- store recovery information securely
- make sure the host clock is correct

Time-based one-time passwords fail when clocks drift. Check:

```bash
timedatectl
systemctl status chrony --no-pager
```

Do not publish QR codes, recovery keys or authentication secrets.

## 8. Review SSH and remote exposure

Do not expose ports `8006` or `22` directly to the public internet.

For local administration:

- keep the management address stable
- use a trusted LAN
- use SSH keys for shell access
- disable password-based SSH only after key login and console recovery have been tested
- use a VPN such as Tailscale for remote access rather than router port forwarding

Changing SSH, firewall and networking simultaneously makes recovery harder. Change one layer, verify it, then continue.

## 9. Plan the firewall carefully

Proxmox has firewall controls at datacentre, node and guest levels. Enabling a firewall without an explicit management rule can lock you out.

Before enabling it:

1. record the management computer or trusted subnet
2. allow the required management traffic
3. keep local-console access available
4. apply the change during a maintenance window
5. test a fresh web and SSH connection

The dedicated firewall guide later in this series will cover the rule hierarchy. For a first setup, a secure LAN and no public port forwarding are safer than rushed rules.

## 10. Configure notifications and backups

Updates and authentication are not a backup plan.

Before important workloads are created, decide:

- where VM and LXC backups will be stored
- how often they will run
- how long they will be retained
- how a restore will be tested
- how the Proxmox host configuration will be recorded

The backup destination should not exist only on the Proxmox system disk. A separate disk, NAS or Proxmox Backup Server creates a better recovery boundary.

Configure a working notification target and send a test notification. Do not assume an address entered during installation is already delivering alerts.

## Troubleshooting

### `apt update` reports a 401 error

The enterprise repository is probably enabled without a valid subscription. Review **Updates → Repositories** and select the repository appropriate to the host.

### APT reports a missing Release file

Do not bypass the warning. Check that every source matches the installed Proxmox major version and its Debian base. Remove copied entries from unrelated tutorials only after recording them.

### The web interface fails after updating

Use the local console:

```bash
ip -brief address
ip route
systemctl status pveproxy --no-pager
journalctl -u pveproxy -b --no-pager
ss -lntp | grep 8006
```

Confirm the address first; do not reinstall the host to fix a service or network problem.

## Final checklist

- [ ] Installed version recorded
- [ ] Correct repository selected
- [ ] Update completed without unexplained errors
- [ ] Controlled reboot verified
- [ ] Named administrator tested
- [ ] Two-factor authentication tested
- [ ] No management ports exposed publicly
- [ ] Notification test received
- [ ] Independent backup destination selected
- [ ] Recovery access documented

Next: [How to Upload an ISO Image to Proxmox](/guides/how-to-upload-iso-image-proxmox/).

