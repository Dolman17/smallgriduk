---
title: "Jellyfin Direct Play vs Transcoding: CPU Use, Quality and Fixes"
description: "Understand Jellyfin direct play, direct stream and transcoding, how each affects CPU usage and quality, and how to reduce unnecessary transcoding."
pubDate: 2026-06-27
updatedDate: 2026-07-06
tags: ["jellyfin", "transcoding", "direct-play", "direct-stream", "low-power", "media"]
cover: "/images/guides/jellyfin-direct-play-vs-transcoding-diagram.webp"
---

## Quick answer

Jellyfin can play media in three main ways:

- **Direct Play** sends the original file to the client unchanged. This uses the least server CPU.
- **Direct Stream** keeps the video or audio largely unchanged but repackages the file into a different container or stream. Server load is usually low.
- **Transcoding** converts video, audio, resolution, bitrate, subtitles, or a combination of them while you watch. This uses the most CPU or GPU power.

For a low-power Jellyfin server, the best outcome is usually **Direct Play first, Direct Stream second, and transcoding only when the client or connection genuinely needs it**.

If Jellyfin is using too much CPU, buffering, or making your mini PC run hot, open the Jellyfin dashboard during playback and check the active session. The playback mode and transcode reason usually tell you exactly what needs fixing.

---

## Jellyfin Direct Play vs transcoding

The practical difference is simple:

| Playback mode | What Jellyfin does | Typical server load | Quality impact |
|---|---|---:|---|
| Direct Play | Sends the original file unchanged | Lowest | Original quality |
| Direct Stream | Repackages the media without fully converting the video | Low | Usually unchanged |
| Transcoding | Converts video, audio, bitrate, resolution, or subtitles | Highest | May reduce quality |

Direct Play is usually the best result because the client device does the playback work. The server mainly reads the file and sends it across the network.

Transcoding moves that work back to the server. Jellyfin must decode the original media, convert it into a compatible format, and stream the result quickly enough to stay ahead of playback.

That difference matters most on:

- low-power mini PCs
- older CPUs
- systems without hardware acceleration
- servers handling several streams
- 4K HEVC libraries
- remote connections with limited bandwidth

A good Jellyfin setup is not the one with the biggest advertised transcoding number. It is the one where most of your real devices can play most of your real library without conversion.

---

## What Direct Play means

Direct Play means Jellyfin sends the media file to the client without changing the video codec, audio codec, resolution, bitrate, subtitles, or container.

The client device handles playback. Examples include:

- smart TV apps
- Android TV and Google TV devices
- Apple TV
- phones and tablets
- desktop applications
- supported web browsers

Direct Play normally gives you:

- the lowest CPU usage
- the lowest power draw
- the least heat
- quieter fans
- original media quality
- fewer buffering problems

For a low-power home server, Direct Play is usually the target.

---

## What transcoding means

Transcoding means Jellyfin converts some part of the media while you watch.

That can include:

- video codec
- audio codec
- resolution
- bitrate
- subtitle handling
- container format

For example, Jellyfin might convert a high-bitrate 4K HEVC file into a lower-bitrate H.264 stream because the client cannot play HEVC or the network cannot carry the original bitrate.

That conversion happens on the server.

On a small mini PC, software transcoding can quickly become the difference between smooth playback and buffering. Hardware transcoding can reduce CPU load, but it still uses resources and requires correct configuration.

---

## Jellyfin Direct Play vs Direct Stream

Direct Stream sits between Direct Play and full transcoding.

It usually means the main video stream is compatible, but the container or delivery method is not. Jellyfin repackages the media into something the client can accept without fully re-encoding the video.

A common example is:

```text
Video codec: supported
Audio codec: supported
Container: not supported by the client
Result: Direct Stream
```

Direct Stream is usually much lighter than full video transcoding. It may use a little more server work than Direct Play, but it is not normally a serious problem on low-power hardware.

The main mode to investigate is **full video transcoding**, especially when it happens unexpectedly.

---

## Does Jellyfin Direct Play use the CPU?

Yes, but normally very little.

During Direct Play, the server still needs to:

- read the media file from storage
- send it across the network
- handle the Jellyfin session
- provide metadata and playback progress

That is much lighter than converting video in real time.

A Direct Play session may show modest CPU activity, especially on slower storage, encrypted connections, or busy servers, but it should not usually drive sustained high CPU usage.

If CPU usage jumps sharply during playback, check whether Jellyfin has switched to Direct Stream or transcoding.

For measuring the real power difference on your own machine, see [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/).

---

## How to tell if Jellyfin is Direct Playing

While a video is playing:

1. Open Jellyfin in a browser.
2. Go to **Dashboard**.
3. Find the active playback session.
4. Check whether it says **Direct Play**, **Direct Stream**, or **Transcoding**.
5. If it is transcoding, read the reason shown beneath the session.

The transcode reason is the most useful clue.

Common reasons include:

- video codec not supported
- audio codec not supported
- bitrate exceeds the client limit
- subtitles require burn-in
- container not supported
- resolution too high
- remote bandwidth limit

Do not guess. Check the active playback session first.

---

## Why Jellyfin transcodes instead of Direct Playing

Jellyfin usually transcodes because the client, connection, or playback settings cannot use the original file as-is.

The most common causes are:

### Unsupported video codec

The client cannot decode the video format. HEVC is a frequent example on older televisions, browsers, and budget streaming devices.

### Unsupported audio codec

The video may be compatible while the audio is not. Jellyfin may transcode only the audio or may change the playback mode depending on the client.

### Subtitles force burn-in

Some subtitle formats must be rendered directly into the video. This forces video transcoding even when the video and audio would otherwise Direct Play.

If playback only transcodes when subtitles are enabled, test with subtitles turned off.

### Client quality is limited

If a client is set to a lower bitrate or resolution, Jellyfin converts the file to match that limit.

For local playback, set quality to **Original** or a sufficiently high value.

### Remote bandwidth is limited

A high-bitrate file may be too large for the available upload or download speed. Jellyfin then creates a smaller stream.

### Browser codec support is limited

A file that Direct Plays in a native Jellyfin app may transcode in a web browser because the browser supports fewer codecs or containers.

### Container incompatibility

The video and audio may be supported, but the container is not. This often leads to Direct Stream rather than full video transcoding.

---

## Best formats for Jellyfin Direct Play

There is no single format that Direct Plays on every client, but some combinations are safer than others.

A practical compatibility target is:

```text
Container: MP4 or MKV
Video:     H.264 for maximum compatibility
           H.265/HEVC for better compression where supported
Audio:     AAC or AC3
Subtitles: External SRT where possible
```

H.264 remains the safest choice for broad client compatibility.

H.265 or HEVC can reduce file size, but older clients may require transcoding. The best answer is often to choose capable playback devices rather than immediately converting an entire library.

For a deeper compatibility breakdown, read [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/).

---

## How to reduce unnecessary Jellyfin transcoding

Work through these checks in order.

### 1. Use a better Jellyfin client

A better client often fixes more than a more powerful server.

Native television apps, Android TV devices, Apple TV devices, and dedicated Jellyfin clients usually support more formats than browser playback.

### 2. Set local quality to Original

If the client is set to a low bitrate, Jellyfin may transcode even though the local network can handle the original file.

Set playback quality to **Original** or a sufficiently high value when watching at home.

### 3. Test without subtitles

Turn subtitles off and replay the same scene.

If the session changes from transcoding to Direct Play, the subtitle format or styling is the likely cause.

External SRT subtitles are usually easier for clients to handle than image-based subtitle formats.

### 4. Check the audio track

Try another audio track if one is available.

A compatible video can still trigger conversion because of DTS, TrueHD, or another unsupported audio format.

### 5. Compare another client

Play the same file on another device.

If one client Direct Plays and another transcodes, the server and file are probably fine. The difference is client compatibility or client settings.

### 6. Check the file bitrate

High-bitrate 4K media may exceed remote bandwidth or client limits.

For remote viewing, a separate 1080p version may be more practical than converting 4K in real time.

### 7. Enable hardware transcoding only when needed

Do not start with hardware transcoding. First confirm why Jellyfin is converting the file.

When transcoding is genuinely required, follow [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/).

---

## Can you force Jellyfin to Direct Play?

You cannot reliably force Direct Play when the client cannot support the original file.

You can encourage Direct Play by:

- using a client that supports the media codecs
- setting playback quality to Original
- using compatible audio tracks
- avoiding subtitles that require burn-in
- keeping media in broadly supported formats
- using a stable local network

Disabling transcoding does not make an incompatible client suddenly support the file. It normally causes playback to fail instead.

The correct goal is not to force Direct Play at any cost. It is to remove the compatibility or settings issue that caused conversion.

---

## When hardware transcoding is useful

Hardware transcoding uses a GPU or dedicated media engine instead of relying only on the CPU.

It is useful when:

- you stream outside the home
- you have several users
- clients cannot play parts of your library
- 4K media sometimes needs conversion
- subtitles regularly require burn-in
- your server includes Intel Quick Sync, VAAPI, or a compatible NVIDIA GPU

For small home setups, Intel Quick Sync is often a practical choice because many used mini PCs already include it.

But hardware transcoding is not magic. It still uses power, adds configuration, and does not fix every compatibility issue.

Default rule:

```text
Prefer Direct Play.
Accept Direct Stream when needed.
Use hardware transcoding when a real playback requirement remains.
```

Before buying hardware, read [Best Mini PC Specs for Jellyfin](/guides/best-mini-pc-specs-for-jellyfin/).

---

## Direct Play vs transcoding quality

Direct Play keeps the original video and audio quality because Jellyfin sends the existing file unchanged.

Transcoding can reduce quality because Jellyfin is creating a new stream in real time. The result depends on:

- target bitrate
- target resolution
- encoder settings
- hardware encoder quality
- source quality
- client limits

A high-quality hardware transcode can still look very good, but it is not identical to the original file.

For local viewing on a capable client, Direct Play normally gives the best quality and the lowest server load.

---

## When transcoding is acceptable

Transcoding is not automatically bad. Unnecessary transcoding is the problem.

It is acceptable when:

- it only happens occasionally
- the server handles it comfortably
- playback remains smooth
- temperatures and fan noise stay reasonable
- remote bandwidth makes it necessary
- you understand why it is happening

For one household, occasional hardware transcoding on a modern mini PC may be completely reasonable.

Do not replace the server just because a single file transcodes. First check the client, subtitle track, audio codec, bitrate, and playback settings.

---

## A sensible low-power Jellyfin setup

A practical SmallGrid-style setup looks like this:

```text
Server:    Low-power mini PC
Storage:   Local SSD/HDD or simple mounted storage
Playback:  Direct Play wherever possible
Fallback:  Direct Stream or hardware transcoding where needed
Remote:    Private access such as Tailscale
Backups:   Jellyfin config and important metadata backed up
Power:     Measured rather than guessed
```

Useful supporting guides:

- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Best Mini PC Specs for Jellyfin](/guides/best-mini-pc-specs-for-jellyfin/)
- [Remote Access Without Port Forwarding: Jellyfin + Tailscale](/guides/jellyfin-tailscale-remote-access/)

---

## Quick troubleshooting checklist

If Jellyfin buffers or uses too much CPU:

1. Open the Jellyfin dashboard during playback.
2. Check whether the session says Direct Play, Direct Stream, or Transcoding.
3. Read the transcode reason.
4. Set client quality to Original on the local network.
5. Turn subtitles off and test again.
6. Try another audio track.
7. Play the same file on another client.
8. Check whether the file is high-bitrate 4K or uses an unusual codec.
9. Only then configure or upgrade hardware transcoding.

Do not start by replacing the server.

---

## Recap

**Direct Play** sends the original file to the client and uses the least server CPU.

**Direct Stream** repackages the media without fully converting the video and is usually lightweight.

**Transcoding** converts video, audio, bitrate, resolution, or subtitles and uses the most server resources.

For a low-power Jellyfin server, aim for Direct Play first. Use Direct Stream when necessary, and use hardware transcoding when it solves a real compatibility or bandwidth problem.