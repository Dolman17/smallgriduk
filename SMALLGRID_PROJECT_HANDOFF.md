# SmallGrid Project Handoff

_Last updated: 19 July 2026_

## Live project details

- **Live website:** https://smallgrid.uk
- **GitHub repository:** `Dolman17/smallgriduk`
- **Live branch:** `main`
- **Framework:** Astro
- **Deployment:** Cloudflare Pages
- **Primary content folders:**
  - Guides: `src/content/guides/`
  - Journal: `src/content/journal/`
  - Public images: `public/images/`
- **Canonical site shell:** `src/layouts/BaseLayout.astro`
- **Content schema:** `src/content/config.ts`

SmallGrid is a practical home-lab site focused on beginner-friendly, evidence-led guidance for Jellyfin, Ubuntu Server, Docker, storage, backups, low-power hardware, remote access, and Proxmox.

The public author name should be **Sean** only. Do not add or restore the surname in visible website content.

## Working method

Changes are made against the live repository and committed to `main`.

The normal workflow is:

1. Inspect the current live file in GitHub.
2. Preserve existing routes, slugs, filenames, frontmatter fields, and unrelated functionality.
3. Make the requested content or layout change.
4. Commit the change directly to `main` with a clear commit message.
5. Fetch the updated file and verify the committed result.
6. Allow Cloudflare Pages to build and deploy from `main`.

For binary assets such as PNG images, Sean uploads the file locally into the correct `public/images/...` folder and pushes it with Git. The guide or journal frontmatter is then updated in the live repository to reference the uploaded asset.

Typical local image workflow:

```bash
cd /home/sean/Projects/smallgrid/smallgriduk

git pull --rebase origin main

git status

git add public/images/<folder>/<filename>.png

git commit -m "Add descriptive image commit message"

git push origin main
```

Do not add unrelated untracked folders such as `public/downloads/` unless explicitly requested.

## Important project constraints

- Do not rename, remove, or alter existing routes or slugs unless Sean explicitly requests it.
- Do not change the duplicate `/tutorials` route arrangement without explicit approval.
- Do not restore advertising or AdSense code.
- Do not invent tests, measurements, hardware specifications, software versions, or first-hand experience.
- Clearly separate tested facts from recommendations.
- Preserve the current light SmallGrid design and performance baseline.
- Prefer full-file replacements for substantial code or content changes rather than incomplete snippets.
- Use UK English.
- Public author references should use **Sean**, not the surname.

## Current design and editorial direction

SmallGrid uses a light, PiMyLifeUp-inspired layout:

- light grey page background
- centred white article card
- clean tutorial structure
- simple navigation
- readable tables and code blocks
- practical, evidence-led writing
- clear troubleshooting and recovery steps

The strongest editorial pattern is:

```text
Real problem
→ direct diagnosis
→ safe fix
→ verification
→ recovery or rollback
→ related guide links
```

## Search Console position and content strategy

Search Console showed a sharp increase in visibility during June and July 2026.

The strongest organic page is:

- `src/content/guides/jellyfin-ubuntu-folder-permissions.md`

The page has ranked near the top of Google for the query:

- `jellyfin permissions ubuntu`

Sean observed SmallGrid as the third result, below Reddit and the Ubuntu Forum.

The current SEO strategy is to:

- leave successful pages stable after major updates
- improve high-impression pages with low click-through rates
- build tightly related topic clusters
- strengthen internal links
- add genuine evidence, worked examples, and verification steps
- avoid repeatedly rewriting recently improved pages before Google has reassessed them

## Completed guide upgrades

The following Jellyfin guides have been strengthened:

### Jellyfin playback and transcoding

- `src/content/guides/how-to-check-why-jellyfin-is-transcoding.md`
- `src/content/guides/jellyfin-direct-stream-vs-direct-play.md`
- `src/content/guides/jellyfin-direct-play-vs-transcoding.md`
- `src/content/guides/best-cheap-jellyfin-client-direct-play.md`

Improvements included:

- clearer comparison tables
- evidence-first diagnosis
- CPU and server-load explanations
- worked playback scenarios
- codec, audio, subtitle, browser, and client examples
- stronger internal links
- improved search titles and descriptions

### Jellyfin storage and permissions

- `src/content/guides/jellyfin-docker-volume-paths-explained.md`
- `src/content/guides/jellyfin-media-library-not-showing-files.md`
- `src/content/guides/jellyfin-ubuntu-folder-permissions.md`
- `src/content/guides/jellyfin-docker-permissions-media-folder.md`

Improvements included:

- host path versus container path explanations
- `docker inspect` and direct file-access checks
- UID/GID and supplementary-group checks
- ACL guidance
- `namei`, `getfacl`, and service-user verification
- read-only versus read-write clarification
- reboot and container-recreation validation
- worked before-and-after diagnoses

### Jellyfin low-power setup

- `src/content/guides/jellyfin-ubuntu-low-power.md`

The guide now includes:

- real SmallGrid storage layout context
- service and mount verification
- safe permission checks
- Direct Play guidance
- wall-meter measurement methodology
- reboot recovery checks
- evidence checklist

## New Proxmox content cluster

The first Proxmox cornerstone guide has been created:

- `src/content/guides/what-is-proxmox-ve-home-server.md`

Title:

- **What Is Proxmox VE? A Beginner's Guide for Home Servers**

It covers:

- what Proxmox VE is
- virtual machines versus LXC containers
- storage and networking concepts
- hardware planning
- Proxmox versus plain Ubuntu Server
- backup and recovery considerations
- when Proxmox is and is not appropriate
- a sensible first lab structure

Hero image:

- `public/images/guides/what_is_proxmox_VE.png`

Guide frontmatter uses:

```yaml
cover: "/images/guides/what_is_proxmox_VE.png"
```

## Journal work completed

### Journal #25

File:

- `src/content/journal/2026-07-week-25.md`

Title:

- **Homelab Journal #25: Rebalancing storage took much longer than expected**

It documents:

- adding a used 4TB hard drive
- moving data from the replaced drive
- verifying the transfer with `rsync`
- separating recovery from rebalancing
- keeping the old source until validation completed
- checking Jellyfin, Sonarr, Radarr, and qBittorrent paths
- the difference between installation time, transfer time, and confidence time

Image:

- `public/images/journal/homelab-journal-25-storage-rebalance.png`

Frontmatter:

```yaml
cover: "/images/journal/homelab-journal-25-storage-rebalance.png"
hero: "/images/journal/homelab-journal-25-storage-rebalance.png"
```

### Journal #23

File:

- `src/content/journal/2026-06-week-23.md`

Title:

- **Homelab Journal #23: Turning notes into SmallGrid guides**

Image:

- `public/images/journal/homelab_23.png`

Frontmatter:

```yaml
cover: "/images/journal/homelab_23.png"
hero: "/images/journal/homelab_23.png"
```

### Journal #22

File:

- `src/content/journal/2026-06-week-22.md`

Title:

- **Homelab Journal #22: Making the setup less embarrassing to explain**

Image:

- `public/images/journal/home_lab_22.png`

Frontmatter:

```yaml
cover: "/images/journal/home_lab_22.png"
hero: "/images/journal/home_lab_22.png"
```

## About page privacy update

The About page is:

- `src/pages/about.astro`

Visible references were changed from the full name to **Sean**:

- `created and maintained by Sean`
- `Created by Sean`

Future visible author references should use **Sean** only.

## Existing SmallGrid environment evidence

Use these facts where relevant, but do not extend them beyond what has actually been verified:

- Ubuntu Server home media server
- Europe/London timezone
- Docker Compose directory: `~/media-stack`
- MergerFS pool: `/srv/media_pool`
- TV library: `/srv/media_pool/TV`
- Jellyfin port: `8096`
- Sonarr port: `8989`
- Prowlarr port: `9696`
- qBittorrentVPN host port: `8081`
- Active pool previously verified at approximately 3.9 TB total with 2.42 TB free
- Host and Jellyfin-visible media counts previously matched at 1,539 files
- Active branch counts were previously recorded as:
  - media1: 623 files
  - media2: 442 files
  - media3: 474 files
- Replacement drive was a used Seagate drive mounted at `/srv/media/media2`
- SMART checks passed at the time of the storage recovery

Do not publish exact current counts, capacity, SMART values, or drive details again without re-verifying them if the guide claims they are current.

# Phased roadmap

## Phase 1 — Complete the Proxmox beginner foundation

Create the following guides in order:

1. **How to Install Proxmox VE: Complete Beginner Guide**
2. **Proxmox First Setup: Updates, Repositories and Basic Security**
3. **How to Upload an ISO Image to Proxmox**
4. **How to Create an Ubuntu Virtual Machine in Proxmox**
5. **How to Create an Ubuntu LXC Container in Proxmox**
6. **Proxmox VM vs LXC: Which Should You Use?**

Requirements:

- use a real test machine
- record exact Proxmox version
- record hardware specifications
- capture actual screenshots
- record network and storage decisions
- verify reboots and guest recovery
- document mistakes and failure points
- do not imply testing until it has been carried out

## Phase 2 — Build the Proxmox storage and backup cluster

Create:

1. **Proxmox Storage Explained: local, local-lvm and Directory Storage**
2. **How to Add a Second Hard Drive to Proxmox**
3. **How to Mount an Existing Linux Drive in Proxmox**
4. **Proxmox Directory Storage vs LVM-Thin**
5. **How to Back Up a Proxmox VM or LXC Container**
6. **How to Restore a Proxmox Backup**
7. **Where Should Proxmox Backups Be Stored?**
8. **How to Move a Proxmox VM to Another Storage Drive**
9. **Proxmox Disk Full: Find What Is Using the Space**

Each guide should link back to the Proxmox cornerstone guide and forward to the next logical task.

## Phase 3 — Add Proxmox networking guides

Create:

1. **Proxmox Linux Bridge Explained for Beginners**
2. **How Proxmox VM Networking Works**
3. **How to Give a Proxmox VM a Static IP**
4. **Proxmox VM Has No Internet: Troubleshooting Guide**
5. **How to Access Proxmox Remotely with Tailscale**
6. **Proxmox Firewall Basics for a Home Server**

Include:

- `vmbr0` explanations
- physical NIC to bridge to guest diagrams
- safe remote-change warnings
- local-console fallback steps
- DNS, gateway, bridge, firewall, and guest-level checks

## Phase 4 — Connect Proxmox with existing SmallGrid topics

Create practical project guides:

1. **Run Docker in a Proxmox VM or LXC?**
2. **How to Build a Docker Server Inside Proxmox**
3. **How to Run Pi-hole in a Proxmox LXC Container**
4. **How to Run Home Assistant in Proxmox**
5. **How to Run Jellyfin in Proxmox**
6. **Jellyfin in a VM vs LXC vs Bare Metal**
7. **How to Pass an Intel GPU Through to Jellyfin**
8. **How to Build a Proxmox Test Lab on One Mini PC**

These guides should connect Proxmox to the existing Jellyfin, Ubuntu, Docker, storage, backup, and power-measurement content clusters.

## Phase 5 — Continue SEO improvements without disturbing winners

Monitor Search Console for:

- Jellyfin Ubuntu permissions
- Jellyfin Direct Play vs Transcoding
- Jellyfin low-power setup
- Jellyfin media library not showing files
- best file formats for Jellyfin Direct Play
- Docker permissions
- new Proxmox impressions and queries

Actions:

- allow recently updated pages time to settle
- do not repeatedly change successful titles
- improve only when query data shows a clear mismatch
- add internal links from strong Jellyfin pages to genuinely relevant Proxmox content
- create narrow troubleshooting guides from recurring search terms
- track click-through rate separately from ranking position

## Phase 6 — Strengthen content operations

Add or maintain:

- a simple content inventory
- publication and updated dates
- image path tracking
- internal-link mapping
- guide cluster mapping
- a record of Search Console opportunities
- a record of pages that should remain stable
- a checklist for new guide evidence

Suggested evidence checklist:

```text
Exact hardware recorded
Exact software version recorded
Commands tested
Expected output recorded
Failure cases documented
Recovery or rollback documented
Reboot tested
Screenshots captured
Internal links added
Title and description reviewed
No unsupported claims
```

## Phase 7 — Community decision later

A forum is not currently planned.

Reconsider GitHub Discussions or a dedicated community only when there is evidence of:

- regular reader questions
- returning contributors
- users helping each other
- enough traffic to avoid an empty forum
- repeated questions that would benefit from public answers

For now, the priority remains high-quality guides, journal entries, Search Console growth, and the new Proxmox cluster.

## Immediate next action

The next recommended task is:

**Create the full Proxmox VE installation guide based on an actual test machine.**

Before writing it, record:

- test-machine make and model
- CPU
- RAM
- storage devices
- network adapter
- BIOS virtualisation settings
- Proxmox ISO version
- installation target
- selected filesystem
- management IP
- gateway and DNS
- post-install repository configuration
- first reboot result
- web-interface access
- backup destination

This keeps the new Proxmox series aligned with the evidence-led approach that has already improved SmallGrid's Jellyfin search performance.
