---
title: "How to Upload an ISO Image to Proxmox"
description: "Download, verify and upload an operating-system ISO to the correct Proxmox storage, then diagnose missing upload buttons and failed transfers."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "virtualisation", "homelab", "iso", "storage", "linux"]
---

## Quick answer

In the Proxmox web interface, select a storage that accepts **ISO image** content—commonly **local**—then open **ISO Images → Upload**, choose the verified ISO and wait for the task to finish.

Do not upload an ISO to `local-lvm`. LVM-thin storage normally holds guest disks, not ordinary ISO files.

This process follows current Proxmox VE 9 behaviour. SmallGrid had not yet uploaded an ISO to its intended host when this guide was published, so no first-hand transfer speed or success claim is made.

Complete [Proxmox First Setup: Updates, Repositories and Basic Security](/guides/proxmox-first-setup-updates-repositories-security/) first.

---

## ISO image or container template?

Use the correct source type:

| You want to create | Source to obtain |
|---|---|
| Virtual machine | Bootable installation ISO, or a deliberately prepared cloud image workflow |
| LXC container | Proxmox container template |

An Ubuntu ISO does not create an LXC container, and an LXC template cannot be attached as a VM installation CD.

## 1. Download from the publisher

Download the ISO from the operating system's official site. For an Ubuntu server VM, use the official [Ubuntu Server download page](https://ubuntu.com/download/server).

Record:

```text
Operating system:
Edition:
Version:
Architecture:
Filename:
Download URL:
Download date:
Published checksum:
```

Use a supported `amd64`/x86-64 image for a normal x86 Proxmox host. Do not choose an ARM image merely because its name also says Ubuntu Server.

## 2. Verify the checksum

On Linux:

```bash
sha256sum ubuntu-server.iso
```

On PowerShell:

```powershell
Get-FileHash .\ubuntu-server.iso -Algorithm SHA256
```

Replace the example filename with the real one. Compare the complete result with the checksum published by Ubuntu.

If it differs, do not upload or boot the file. Download it again from the official source and recheck it.

## 3. Find storage that accepts ISO images

In the left-hand tree, expand the node and select **local**. Open **Summary** and **ISO Images**.

The default installation commonly separates storage like this:

| Storage | Typical purpose |
|---|---|
| `local` | ISO images, container templates, backups and snippets, depending on configuration |
| `local-lvm` | VM and container disks on LVM-thin storage |

These names describe a common default, not a guarantee. Check the actual host at **Datacenter → Storage**.

A storage only shows the ISO workflow when its permitted **Content** includes **ISO image**.

## 4. Upload through the web interface

1. Select the node.
2. Select the ISO-capable storage, normally **local**.
3. Open **ISO Images**.
4. Select **Upload**.
5. Choose the verified file.
6. Check the filename and file size.
7. Start the upload.
8. Leave the browser tab open until the task finishes.

Open the task at the bottom of the interface and read its status. A file appearing in the list is useful, but the task should also finish with `TASK OK`.

## 5. Verify the stored file

Select the uploaded ISO and check its reported size. From the node shell, you can inspect ISO-capable storage without guessing its path:

```bash
pvesm status
pvesm list local --content iso
```

Replace `local` if your ISO storage has another verified ID.

Do not assume every directory storage uses the same path. View it at **Datacenter → Storage → your storage → Edit** or query it with:

```bash
pvesm config local
```

## Downloading directly on the host

The web interface may offer **Download from URL** on suitable storage. Use only an official HTTPS URL and verify the result against the publisher's checksum.

For large or unreliable browser uploads, downloading on the host can be practical, but do not blindly copy a command containing an expiring or redirected URL.

Check free space first:

```bash
df -h
pvesm status
```

An ISO does not belong on the root filesystem merely because that path is easy to reach. Store it through configured Proxmox storage.

## Why the Upload button is missing

The usual causes are:

- `local-lvm` or another block storage is selected
- the selected storage does not allow ISO content
- the user lacks storage permissions
- the storage is disabled or unavailable
- the browser is showing a different node or storage than expected

Check **Datacenter → Storage → selected storage → Content**.

Only add ISO content to a directory-style storage that can actually hold files. Do not change an LVM-thin storage's content types to imitate directory storage.

## Upload fails part-way through

Check:

```bash
df -h
pvesm status
journalctl -p err -b --no-pager
```

Also check:

- client-to-host network stability
- browser or reverse-proxy upload limits
- available space on the target storage
- the Proxmox task log
- whether the management session expired

If the host is reached through a proxy or tunnel, repeat the upload directly over the trusted LAN before changing Proxmox.

## ISO appears but will not boot

An upload can succeed while the image itself is wrong. Confirm:

- the architecture is correct
- the checksum matches
- the VM has the ISO attached to its CD/DVD drive
- the CD/DVD drive is early enough in the VM boot order
- the ISO is an installer, not a checksum or torrent file

Do not repeatedly upload the same unverified file.

## Remove an ISO safely

Before deleting an ISO, check whether a VM still has it attached. Removing the file does not normally remove an installed guest, but it can prevent that VM from booting the installer or recovery environment later.

Select the ISO under its storage and choose **Remove** only after confirming the exact filename.

## Final checklist

- [ ] ISO downloaded from the official publisher
- [ ] Architecture checked
- [ ] SHA-256 checksum matched
- [ ] Correct ISO-capable storage selected
- [ ] Upload task ended successfully
- [ ] Stored file size checked
- [ ] Filename and version recorded
- [ ] Enough storage remains for normal host operation

Next: [How to Create an Ubuntu Virtual Machine in Proxmox](/guides/create-ubuntu-virtual-machine-proxmox/).

