---
title: "Jellyfin Docker Volume Paths Explained: Host Paths vs Container Paths"
description: "Understand Jellyfin Docker volume mappings, host paths, container paths, read-only mounts, PUID and PGID, and why media folders appear empty."
pubDate: 2026-07-08
tags: ["jellyfin", "docker", "volumes", "permissions", "media", "paths"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

Docker gives Jellyfin one path on the host and another path inside the container.

Example:

```yaml
volumes:
  - /srv/media/movies:/media/movies:ro
```

This means:

```text
Host path:      /srv/media/movies
Container path: /media/movies
```

Inside Jellyfin, add `/media/movies`, not `/srv/media/movies`.

---

## How Docker volume mappings work

A bind mount follows this pattern:

```text
HOST_PATH:CONTAINER_PATH:OPTIONS
```

Example:

```yaml
- /srv/media/tv:/media/tv:ro
```

The left side exists on the Ubuntu host. The right side is what Jellyfin can see inside the container.

The optional `ro` means read-only.

---

## A complete Compose example

```yaml
services:
  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    volumes:
      - ./config:/config
      - /srv/media/movies:/media/movies:ro
      - /srv/media/tv:/media/tv:ro
    ports:
      - "8096:8096"
    restart: unless-stopped
```

Jellyfin library paths should be:

```text
/media/movies
/media/tv
```

---

## Why the folder appears empty

Common causes include:

- the host path is wrong
- the container path is different from the Jellyfin library path
- the host drive is not mounted
- the container lacks permission to read the files
- a new Compose file was not applied
- the bind mount points to an empty directory

Test the host first:

```bash
ls -la /srv/media/movies
```

Then test inside the container:

```bash
docker exec -it jellyfin ls -la /media/movies
```

If the host shows files but the container does not, the problem is the Docker mapping.

---

## Read-only vs read-write mounts

For normal playback, Jellyfin only needs read access to media.

Use:

```yaml
- /srv/media:/media:ro
```

A read-only mount reduces the chance of accidental media changes from inside the container.

Jellyfin's config directory must remain writable:

```yaml
- ./config:/config
```

---

## PUID and PGID

LinuxServer containers commonly use `PUID` and `PGID`.

Find your user IDs:

```bash
id
```

Example output:

```text
uid=1000(sean) gid=1000(sean)
```

Then use:

```yaml
- PUID=1000
- PGID=1000
```

The selected user or group must be able to read the host media files.

---

## Apply Compose changes

After editing the Compose file:

```bash
docker compose up -d
```

Then verify the mounts:

```bash
docker inspect jellyfin
```

Check the `Mounts` section for the expected source and destination paths.

---

## Nested paths and overlapping mounts

Avoid confusing overlapping mappings such as:

```yaml
- /srv/media:/media
- /srv/media/movies:/media/movies
```

Use either one broad media mapping or clear separate mappings unless you have a specific reason.

Simple example:

```yaml
- /srv/media:/media:ro
```

Then use `/media/movies` and `/media/tv` in Jellyfin.

---

## Exact verification sequence

```bash
findmnt /srv/media
ls -la /srv/media
docker compose up -d
docker exec -it jellyfin ls -la /media
docker inspect jellyfin
docker logs --tail 100 jellyfin
```

Interpretation:

- host path empty: fix the mount or source path
- container path empty: fix the bind mount
- permission denied: fix UID, GID, group access, or ACLs
- files visible inside container: check the Jellyfin library path and scan

---

## Related guides

- [Jellyfin Docker Permissions](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)

---

## Recap

The host path is where the media lives on Ubuntu. The container path is what Jellyfin sees.

Use the container path inside Jellyfin, verify it with `docker exec`, and keep media read-only where possible.