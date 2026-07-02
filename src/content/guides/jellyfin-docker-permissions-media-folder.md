---
title: "Jellyfin Docker Permissions: Fix Media Folder Access Properly"
description: "Fix Jellyfin Docker media folder permission problems using bind mounts, container paths, user IDs, group IDs, and read-only volumes."
pubDate: 2026-07-02
tags: ["jellyfin", "docker", "permissions", "media", "homelab"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Goal

Fix Jellyfin Docker permission problems without guessing.

This guide covers the common Docker-specific issues:

- Jellyfin cannot see mounted media
- the path works on the host but not in Jellyfin
- the container path is different from the host path
- files show as permission denied
- the wrong user ID or group ID is running the container

If Jellyfin is installed directly on Ubuntu instead of Docker, use [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## The default recommendation

Use simple bind mounts and make them read-only unless Jellyfin needs to write to the media folder.

A clean Docker layout is:

```text
Host media path:      /srv/media
Container media path: /media
Jellyfin library path: /media
```

The path you add inside Jellyfin is the container path, not necessarily the host path.

---

## The most common mistake

This is the classic problem:

```text
Host path: /srv/media/movies
Container path: /media/movies
```

Inside Jellyfin, you add:

```text
/srv/media/movies
```

But that path does not exist inside the container.

You should add:

```text
/media/movies
```

The host path is for Docker. The container path is for Jellyfin.

---

## Step 1: Check your Docker Compose file

A simple Jellyfin Docker Compose setup might look like this:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin
    container_name: jellyfin
    restart: unless-stopped
    ports:
      - "8096:8096"
    volumes:
      - /srv/jellyfin/config:/config
      - /srv/jellyfin/cache:/cache
      - /srv/media:/media:ro
```

The important line is:

```yaml
- /srv/media:/media:ro
```

This means:

```text
/srv/media on the host appears as /media inside the container
```

The `:ro` means read-only.

---

## Step 2: Check the host path exists

On the Docker host, run:

```bash
ls -la /srv/media
ls -la /srv/media/movies
```

If the path does not exist on the host, Docker cannot mount it properly.

If the folder exists but is empty, check whether the disk or NAS share is mounted.

```bash
findmnt
lsblk
```

---

## Step 3: Check the path inside the container

Run a shell inside the Jellyfin container:

```bash
docker exec -it jellyfin bash
```

Then check the container path:

```bash
ls -la /media
ls -la /media/movies
```

If `/media` is empty or missing, the volume mount is wrong.

Exit the container:

```bash
exit
```

---

## Step 4: Check which user runs the container

If you use the official Jellyfin image without a custom user, permissions may differ from a LinuxServer-style setup.

Check the running container:

```bash
docker inspect jellyfin --format '{{.Config.User}}'
```

If that returns empty, the container is using its image default.

If you deliberately run Jellyfin as your own user, you might have something like:

```yaml
user: "1000:1000"
```

Then the host files need to be readable by that user or group.

---

## Step 5: Use your real UID and GID if needed

On the host, check your user ID:

```bash
id
```

Example:

```text
uid=1000(sean) gid=1000(sean)
```

Then Docker Compose can use:

```yaml
user: "1000:1000"
```

But this only works if that user can read the media files on the host.

Test on the host:

```bash
ls -la /srv/media
```

---

## Step 6: Keep media read-only unless needed

For a normal Jellyfin library, read-only media is safer:

```yaml
- /srv/media:/media:ro
```

Jellyfin can still read and scan the media.

Use read-write only if you need Jellyfin or a plugin to write into the media folder:

```yaml
- /srv/media:/media:rw
```

Do not give write access just because it seems easier.

---

## Step 7: Restart the container cleanly

After changing Docker Compose:

```bash
docker compose down
docker compose up -d
```

Then check logs:

```bash
docker logs --tail=100 jellyfin
```

In Jellyfin, rescan the library:

```text
Dashboard → Libraries → Scan All Libraries
```

---

## Step 8: Add the correct library path in Jellyfin

If your Compose file has:

```yaml
- /srv/media:/media:ro
```

Then inside Jellyfin, add:

```text
/media
```

or a subfolder:

```text
/media/movies
/media/tv
```

Do not add `/srv/media` unless `/srv/media` is also the path inside the container.

---

## Common problem: NAS shares

If `/srv/media` is actually a mounted NAS share, make sure it is mounted before Docker starts.

Check:

```bash
findmnt | grep media
```

If Docker starts before the share mounts, Jellyfin may see an empty folder.

A simple fix is to make sure the mount is reliable in `/etc/fstab`, then restart Docker after confirming the mount exists.

---

## Common problem: Docker Desktop on Windows or macOS

For a small home server, Docker on Linux is the cleaner setup.

Windows and macOS Docker setups add extra filesystem and hardware acceleration complications. If you want a reliable always-on Jellyfin box, use native Linux or a Linux server VM.

---

## Quick verification checklist

Check these in order:

```bash
ls -la /srv/media
docker ps
docker exec -it jellyfin bash
ls -la /media
exit
docker logs --tail=100 jellyfin
```

Then confirm in Jellyfin:

```text
Library path uses /media or /media/movies
Library scan runs
Files appear
Playback works
```

---

## Next steps

Useful related guides:

- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

Docker has two paths to think about:

```text
Host path:      used in docker-compose.yml
Container path: used inside Jellyfin
```

Most Jellyfin Docker library problems are caused by using the host path inside Jellyfin, or by running the container as a user that cannot read the mounted media folder.

Keep the mount simple, test inside the container, and add the container path to Jellyfin.
