# SmallGrid content-quality audit

Date: 9 July 2026

Purpose: identify strong articles, thin articles, overlapping search intent, missing first-hand evidence, and the safest upgrade order before another AdSense review.

## Rating method

- **Strong** — solves a complete problem, has useful commands or checks, and has clear troubleshooting structure.
- **Needs improvement** — useful and distinct, but needs more first-hand evidence, examples, screenshots, measurements, or validation output.
- **Thin** — correct but too brief, generic, or insufficiently demonstrated to stand out from similar web content.
- **Overlapping** — useful subject, but parts of the article compete heavily with another SmallGrid guide.
- **Outdated** — contains steps that require technical revalidation before promotion.

No guide has been marked outdated in this first pass. Software versions and menu paths still need a separate technical revalidation pass.

## Executive findings

The strongest content is the permissions and library-diagnosis cluster. These pages contain concrete commands, sensible troubleshooting order, interpretation guidance, and useful cross-links.

The weakest content is the newer playback and buying-advice cluster. Several articles are accurate but generic, short, and light on real test results. They often state what readers should test without showing SmallGrid's own results.

The largest overlap cluster is:

- Jellyfin library not showing files
- Jellyfin not scanning new files
- Ubuntu folder permissions
- Docker permissions
- Docker volume paths
- Media disappearing after reboot
- External USB drive access

These should remain separate, but each needs a strict scope statement and fewer repeated generic sections.

The second overlap cluster is:

- Direct Play vs transcoding
- Direct Stream vs Direct Play
- How to check why Jellyfin is transcoding
- Subtitles causing transcoding
- Best file formats for Direct Play
- Cheap Jellyfin clients

These should form a deliberate playback hub with distinct search intent, real playback examples, and consistent test files.

## Guide-by-guide audit

| Guide | Rating | Main issue | Required upgrade |
|---|---|---|---|
| Jellyfin Library Not Showing Files | **Strong** | Broad enough to overlap with permissions, mounts, Docker and scanning guides | Add a tested-case box with real commands and abbreviated output; keep this page as the diagnostic decision tree and shorten duplicated fix instructions |
| Give Jellyfin Access to Media Folders on Ubuntu | **Strong** | Good commands but little visible real output | Add `id jellyfin`, `namei -l`, `getfacl`, failed access and successful access examples from a sanitised test path |
| Jellyfin Docker Permissions | **Needs improvement** | Useful workflow, but generic and missing a complete before/after Compose example and inspect output | Add one tested Compose stack, real `docker inspect` output, container UID/GID findings, and a validation block |
| Jellyfin Not Scanning New Files | **Overlapping** | Repeats ACL, mount and Docker content from the broader library and permissions guides | Keep focus on old files working while new files fail; add a real Sonarr/Radarr/qBittorrent-created file comparison and reduce generic mount guidance |
| Jellyfin on Ubuntu: Low-Power Setup | **Strong / needs evidence** | Broad cornerstone guide likely valuable, but needs visible build evidence | Add the actual host specification, Ubuntu version, Jellyfin version, idle power measurement method, storage layout and post-reboot checks |
| Best Video Format for Jellyfin Direct Play | **Strong / needs evidence** | Good search intent, but recommendations need client-specific proof | Add a reusable test matrix covering H.264, HEVC, MKV, MP4, AAC, AC3, SRT and PGS across actual clients |
| Jellyfin Direct Play vs Transcoding | **Needs improvement** | Foundational topic, but overlaps with Direct Stream and diagnosis articles | Make this the conceptual cornerstone; add dashboard screenshots, CPU/power examples and links to narrower troubleshooting pages |
| How to Check Why Jellyfin Is Transcoding | **Thin** | Clear but only about 180 lines and mostly generic instructions | Add real dashboard examples, `ffprobe` output, log excerpts, a worked diagnosis and the resulting fix |
| Jellyfin Direct Stream vs Direct Play | **Thin** | Accurate but very short and conceptually close to the main Direct Play article | Add two or three actual playback examples, server-load comparison, audio-transcode edge case and dashboard evidence |
| Jellyfin Subtitles Causing Transcoding | **Needs improvement** | Distinct search intent, but likely repeats generic subtitle advice | Add tested SRT, ASS/SSA, PGS and VobSub results on named client types, plus dashboard screenshots and burn-in behaviour |
| Best Cheap Jellyfin Client for Direct Play | **Thin** | Generic categories rather than tested recommendations; title promises more specificity than the article provides | Add named devices actually tested, price/date context, codec matrix, networking results, remote usability and a clear winner by use case |
| Jellyfin Docker Volume Paths Explained | **Thin / overlapping** | Strong beginner query but close to Docker permissions guide | Keep it strictly about host path vs container path; add annotated Compose diagrams, `docker inspect` mounts output and three common broken mappings |
| Jellyfin Media Disappears After Reboot | **Needs improvement** | Useful intent but overlaps with the mount sections in broader guides | Add a real failed-mount case, `findmnt`, `lsblk -f`, `/etc/fstab`, `mount -a`, service ordering and recovery proof |
| Jellyfin Cannot Access External USB Drive | **Needs improvement** | Distinct hardware/storage intent, but can become generic Linux permissions content | Add tested ext4, NTFS or exFAT examples, actual mount options, stable UUID configuration and reboot validation |
| Jellyfin Tailscale Remote Access | **Strong / needs evidence** | Good specialist topic, but should prove the final result and safety boundaries | Add sanitised Tailscale status output, client connection test, port exposure check, failure cases and explicit note that no router port forwarding is required |
| Backups: 3-2-1 for Home Servers | **Strong / needs evidence** | Good cornerstone topic, but trust depends on restore proof | Add the actual backup sources, destinations, schedule, retention, verification command and a documented restore test |
| Best Mini PC Specs for Jellyfin | **Needs improvement** | Buying/specification advice is vulnerable to becoming generic | Add hardware personally used, measured idle draw, tested simultaneous streams, Quick Sync generation notes and clear budget tiers |

## Priority upgrade order

### Priority 1 — first-hand evidence on existing strong pages

1. Jellyfin Library Not Showing Files
2. Ubuntu Folder Permissions
3. Jellyfin Ubuntu Low-Power Setup
4. Backups: 3-2-1 for Home Servers
5. Best Video Format for Jellyfin Direct Play

These pages are the closest to cornerstone quality. Adding proof is more valuable than publishing more short guides.

### Priority 2 — improve thin playback articles

1. How to Check Why Jellyfin Is Transcoding
2. Direct Stream vs Direct Play
3. Subtitles Causing Transcoding
4. Best Cheap Jellyfin Client

Use one consistent SmallGrid playback test set so results can be compared across pages.

Recommended test set:

- 1080p H.264 + AAC in MP4
- 1080p H.264 + AC3 in MKV
- 1080p HEVC Main 10 in MKV
- 4K HEVC Main 10 HDR sample
- external SRT subtitles
- embedded ASS/SSA subtitles
- embedded PGS subtitles
- high-bitrate local sample

Record for each client:

- Direct Play, Direct Stream or Transcoding
- stated Jellyfin transcode reason
- video conversion
- audio conversion
- subtitle burn-in
- approximate server CPU use
- buffering or playback issue

### Priority 3 — separate the storage and permissions cluster

Each page needs a clear one-sentence scope near the top:

- **Library not showing files:** broad diagnostic decision tree.
- **Ubuntu permissions:** native Linux user, group, parent traversal and ACL repair.
- **Docker permissions:** container user identity and host permissions.
- **Docker volume paths:** host-to-container mapping only.
- **Not scanning new files:** inheritance, downloader/importer ownership and umask.
- **Media disappears after reboot:** failed or late mounts.
- **External USB drive:** filesystem and mount-option behaviour.

Repeated material should be replaced with short summaries and links to the dedicated article.

## First-hand evidence standard

Every cornerstone guide should contain at least three of the following:

- a sanitised command and its actual output
- a real screenshot with sensitive data removed
- the tested operating-system and application version
- actual hardware details
- measured power, storage, CPU or playback results
- a failure observed during testing
- the exact correction that resolved it
- a final verification command
- a reboot or restore test
- a dated review note

Avoid claiming a guide was tested when it only describes a plausible procedure. The trust panel should remain accurate for the evidence shown in the article.

## Thin-page rule

A guide should not be expanded only to reach a word count. It should be expanded when it lacks one or more of:

- a complete answer
- evidence
- interpretation of results
- failure handling
- a clear boundary with related guides
- a final verification step

Where a topic cannot support a distinct, evidence-rich guide, merge or redirect it only after a separate route and SEO review. No routes should be changed during the content rewrite stage without explicit approval.

## Hub and utility-page audit

The following pages should be reviewed after the guide upgrades:

- Tutorials hub — ensure it explains learning paths rather than only listing cards.
- Guides index — group articles into clear problem-led clusters.
- Jellyfin hub — present diagnostic paths for files, playback, storage, Docker and remote access.
- Checklists — each checklist landing page should explain when and how to use the download.
- Recommended Gear — include selection criteria, tested equipment and disclosure language; avoid becoming a link list.
- Journal — retain genuinely first-hand build notes and measurements; avoid very short entries with no practical takeaway.
- Search — already set to `noindex,follow`.

## Technical checks still required

- Validate all internal links.
- Confirm every cover image exists and has dimensions.
- Confirm every guide has `updatedDate` when materially reviewed.
- Confirm current Jellyfin menu labels and supported-platform behaviour.
- Check structured data after the new author and date presentation.
- Resolve the known duplicate `/tutorials` route separately, with explicit approval before changing routing.
- Run the Astro production build after the content changes.

## AdSense re-review gate

Do not request another review until all of these are true:

- at least five cornerstone guides contain visible first-hand evidence
- the four thinnest playback/client guides are substantially improved
- overlapping articles have distinct scope statements
- weak hub pages have been strengthened
- internal search is noindexed
- empty advert placeholders remain hidden
- the sitemap has been resubmitted
- key updated pages have been recrawled
- at least two weeks have passed after the main content deployment, preferably longer if Search Console has not refreshed

## Next implementation task

Upgrade **Jellyfin Library Not Showing Files** first by adding a sanitised real-world case study, actual command output, a shorter diagnostic decision table, and a final verified-result block. Preserve its route and existing search intent.
