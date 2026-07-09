---
title: "Jellyfin Subtitles Causing Transcoding: How to Stop Burn-In"
description: "Fix Jellyfin subtitle burn-in and unnecessary transcoding. Learn which subtitle formats Direct Play, why PGS causes problems, and how to test client support."
pubDate: 2026-07-08
tags: ["jellyfin", "subtitles", "transcoding", "direct-play", "pgs", "srt"]
cover: "/images/guides/jellyfin-subtitles-transcoding.svg"
---

## Quick answer

If Jellyfin only transcodes when subtitles are enabled, the subtitle format or client support is usually the cause.

Test this first:

1. Play the file with subtitles off.
2. Check the active session in the Jellyfin dashboard.
3. Turn subtitles on.
4. Check whether the session changes from Direct Play to Transcoding.

External SRT subtitles are usually the safest format. Image-based formats such as PGS often force Jellyfin to burn subtitles into the video, which requires full video transcoding.

---

## Why subtitles cause transcoding

Subtitles can be either text-based or image-based.

Text-based subtitles contain characters that the client renders during playback. Image-based subtitles contain pictures that must be overlaid onto the video.

When the client cannot render the subtitle track itself, Jellyfin may burn the subtitles into every video frame. That forces video transcoding even when the video and audio would otherwise Direct Play.

Common subtitle formats:

| Format | Type | Typical result |
|---|---|---|
| SRT | Text | Best compatibility |
| WebVTT | Text | Good browser support |
| ASS/SSA | Styled text | May transcode on limited clients |
| PGS | Image | Often requires burn-in |
| VobSub | Image | Often requires burn-in |

---

## How to confirm subtitle burn-in

Open the Jellyfin dashboard while the file is playing.

Look for a transcode reason such as:

```text
SubtitleCodecNotSupported
Subtitle burn-in required
ContainerBitrateExceedsLimit
```

The exact wording can vary by client and Jellyfin version.

Compare these two tests:

```text
Subtitles off: Direct Play
Subtitles on:  Transcoding
```

That confirms the subtitle track is the trigger.

---

## Use external SRT subtitles

External SRT files are widely supported and easy to manage.

Use matching names:

```text
Film Name (2026).mkv
Film Name (2026).en.srt
```

For television:

```text
Show Name - S01E01.mkv
Show Name - S01E01.en.srt
```

Place the subtitle file beside the video and rescan the library if it does not appear.

---

## Try a different client

A file can transcode in a browser but Direct Play in a native Jellyfin app.

Test the same file on:

- Jellyfin Media Player
- Android TV
- Apple TV
- a smart-TV app
- a phone or tablet app

If only one client burns the subtitles in, the server and file may be fine. The limitation is client-side subtitle support.

---

## Convert PGS subtitles to SRT

PGS subtitles are image-based. Converting them to SRT can avoid burn-in, but OCR is required because the images must be turned into text.

Tools such as Subtitle Edit can perform OCR and export SRT files.

Always proofread the result. OCR can misread punctuation, names, and timing.

Keep the original PGS track when accuracy matters, but add an SRT option for clients that cannot render PGS directly.

---

## Check audio and video too

A subtitle track may not be the only reason Jellyfin is transcoding.

Check the dashboard for:

- unsupported video codec
- unsupported audio codec
- bitrate limits
- resolution limits
- container incompatibility

Use [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/) for a complete diagnosis.

---

## Best subtitle setup for Direct Play

A practical compatibility target is:

```text
Primary subtitle: External SRT
Optional subtitle: Original PGS or ASS track
Client: Native Jellyfin app where possible
```

This keeps the original subtitle option while providing a lightweight text-based alternative.

---

## Related guides

- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Jellyfin Direct Stream vs Direct Play](/guides/jellyfin-direct-stream-vs-direct-play/)

---

## Recap

If subtitles trigger transcoding, test with subtitles disabled, inspect the transcode reason, and try an external SRT track.

PGS and VobSub are common causes of burn-in. A better client or a text-based subtitle track can often restore Direct Play without changing the video file.