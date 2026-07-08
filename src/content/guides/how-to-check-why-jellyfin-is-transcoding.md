---
title: "How to Check Why Jellyfin Is Transcoding"
description: "Find the exact reason Jellyfin is transcoding. Check the dashboard, codecs, bitrate, subtitles, audio, client limits, and hardware acceleration step by step."
pubDate: 2026-07-08
tags: ["jellyfin", "transcoding", "troubleshooting", "direct-play", "dashboard"]
cover: "/images/guides/jellyfin-direct-play-vs-transcoding-diagram.webp"
---

## Quick answer

Open the Jellyfin dashboard while the file is playing and inspect the active session.

Jellyfin will normally show:

```text
Direct Play
Direct Stream
Transcoding
```

If it is transcoding, read the reason shown under the session. That reason is more useful than guessing based on CPU usage alone.

---

## Step 1: Check the active playback session

While the problem file is playing:

1. Open Jellyfin in a browser.
2. Go to **Dashboard**.
3. Find the active user session.
4. Check the playback mode.
5. Read the transcode reason.

Common reasons include:

```text
Video codec not supported
Audio codec not supported
Subtitle burn-in required
Bitrate exceeds client limit
Resolution not supported
Container not supported
```

---

## Step 2: Test with subtitles disabled

Turn subtitles off and replay the same scene.

If the session changes from Transcoding to Direct Play, the subtitle track is the cause.

Image-based PGS and VobSub subtitles commonly require burn-in. External SRT files are usually safer.

See [Jellyfin Subtitles Causing Transcoding](/guides/jellyfin-subtitles-causing-transcoding/).

---

## Step 3: Try another audio track

A compatible video can still trigger audio conversion.

Try another audio track and check the dashboard again.

Formats such as DTS, TrueHD, or EAC3 may be unsupported on some clients. AAC and AC3 are generally safer compatibility choices.

Audio-only transcoding is usually lighter than video transcoding, but it still changes the playback mode.

---

## Step 4: Compare another client

Play the same file using another device or application.

Useful comparisons include:

- browser vs Jellyfin Media Player
- smart-TV app vs Android TV device
- phone app vs browser

If one client Direct Plays and another transcodes, the difference is client support or client settings.

---

## Step 5: Check the quality setting

A client set to a lower bitrate may force Jellyfin to create a smaller stream.

For local playback, set quality to:

```text
Original
```

For remote playback, compare the media bitrate with your available home upload speed and the client quality limit.

---

## Step 6: Inspect the media file

Use `ffprobe`:

```bash
ffprobe -hide_banner "Film Name.mkv"
```

Check:

- video codec
- audio codec
- subtitle codec
- resolution
- bitrate
- container

Then compare those details with the client capabilities.

---

## Step 7: Check whether only the container is changing

If Jellyfin says Direct Stream, the video may not be re-encoded.

Direct Stream often means the codecs are compatible but the container is not. Jellyfin repackages the streams into a format the client accepts.

This is usually much lighter than full video transcoding.

Read [Jellyfin Direct Stream vs Direct Play](/guides/jellyfin-direct-stream-vs-direct-play/).

---

## Step 8: Check hardware acceleration

If transcoding is genuinely required, confirm whether Jellyfin is using the CPU or supported hardware acceleration.

On Ubuntu, check the Jellyfin logs:

```bash
sudo journalctl -u jellyfin --no-pager -n 200
```

For Docker:

```bash
docker logs --tail 200 jellyfin
```

Look for hardware-device, VAAPI, Quick Sync, NVENC, or permission errors.

Use [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) for configuration guidance.

---

## Exact troubleshooting order

Use this sequence:

1. Read the dashboard transcode reason.
2. Disable subtitles.
3. Try another audio track.
4. Set local quality to Original.
5. Test another client.
6. Inspect the file with `ffprobe`.
7. Check hardware acceleration only if conversion is necessary.

Do not replace the server before identifying the actual trigger.

---

## Related guides

- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Jellyfin Subtitles Causing Transcoding](/guides/jellyfin-subtitles-causing-transcoding/)
- [Jellyfin Direct Stream vs Direct Play](/guides/jellyfin-direct-stream-vs-direct-play/)
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)

---

## Recap

The Jellyfin dashboard is the starting point. Read the active session and the stated transcode reason before changing files, clients, or hardware.

Most unexpected transcoding comes from subtitles, audio compatibility, client limits, or unsupported codecs.