---
title: "Jellyfin Direct Play vs Transcoding: Differences, CPU Use and How to Check"
description: "Compare Jellyfin Direct Play, Direct Stream and transcoding. Learn how each affects CPU use and quality, why transcoding starts, and how to diagnose it."
pubDate: 2026-06-27
updatedDate: 2026-07-14
tags: ["jellyfin", "transcoding", "direct-play", "direct-stream", "low-power", "media"]
cover: "/images/guides/jellyfin-direct-play-vs-transcoding-diagram.webp"
---

## Quick answer

Jellyfin uses three main playback modes:

| Playback mode | What happens | Video re-encoded? | Typical server load | Quality |
|---|---|---:|---:|---|
| **Direct Play** | Jellyfin sends the original file to the client | No | Lowest | Original |
| **Direct Stream** | Jellyfin repackages compatible streams into another container or delivery format | No | Low | Usually unchanged |
| **Transcoding** | Jellyfin converts video, audio, resolution, bitrate, subtitles, or several of these | Sometimes or yes | Highest | May change |

For a low-power Jellyfin server, the preferred order is:

```text
Direct Play first
Direct Stream second
Transcoding only when the client or connection requires it
```

Direct Play is not always possible, and transcoding is not automatically a fault. The important questions are:

1. **Why did Jellyfin choose this playback mode?**
2. **Is the resulting server load acceptable?**

Open the Jellyfin dashboard while the problem file is playing. The active session should show the playback mode and, when conversion is happening, the reason.

Use [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/) for the full step-by-step diagnosis of one problem file.

---

## What this guide covers

This is the conceptual cornerstone for Jellyfin playback.

It explains:

- the difference between Direct Play, Direct Stream, audio transcoding, and video transcoding
- which mode normally uses the most CPU or GPU resources
- when quality can change
- why a compatible-looking file may still transcode
- how clients, subtitles, audio, bitrate, and remote bandwidth affect playback
- when hardware transcoding is useful
- how to decide whether anything actually needs fixing

It does not duplicate the full troubleshooting workflows in the narrower guides.

Use:

- [Jellyfin Direct Stream vs Direct Play](/guides/jellyfin-direct-stream-vs-direct-play/) for remuxing and container behaviour
- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/) for session-by-session diagnosis
- [Jellyfin Subtitles Causing Transcoding](/guides/jellyfin-subtitles-causing-transcoding/) for burn-in problems
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/) for library format choices
- [Best Cheap Jellyfin Client for Direct Play](/guides/best-cheap-jellyfin-client-direct-play/) for client selection
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) when conversion is necessary and needs acceleration

---

## Direct Play, Direct Stream and transcoding compared

### Direct Play

Direct Play means the client accepts the complete media combination without server-side conversion:

- container
- video codec and profile
- audio codec and channel layout
- subtitle format
- resolution
- bitrate
- HDR format, where relevant
- delivery method used by the client

Jellyfin mainly reads the original file and sends it across the network.

Typical benefits:

- original video and audio quality
- minimal CPU activity
- lower power use
- less heat and fan noise
- no temporary video conversion
- better capacity for several simultaneous users

### Direct Stream

Direct Stream is often called **remuxing**.

It usually means the video stream is already compatible, but the client cannot accept the original container or delivery format.

Example:

```text
Container: MKV
Video: H.264 supported
Audio: AAC supported
Client accepts MP4-style delivery but not the original MKV
Result: Direct Stream
```

Jellyfin repackages the compatible streams rather than re-encoding the video.

This normally uses little server CPU and does not reduce video quality.

Audio can still be converted during a Direct Stream session if the selected track is unsupported. That is why the dashboard details matter more than the headline mode alone.

### Transcoding

Transcoding means Jellyfin converts one or more parts of the media during playback.

Possible conversions include:

- HEVC to H.264
- 4K to 1080p
- high bitrate to a lower bitrate
- TrueHD or DTS to AAC or AC3
- HDR to SDR tone mapping
- subtitle burn-in
- container and delivery changes alongside stream conversion

Video transcoding is normally the expensive operation. Audio-only conversion is usually much lighter.

---

## Which mode uses the most CPU?

The normal order is:

```text
Lowest load
Direct Play
Direct Stream or audio-only conversion
Hardware-accelerated video transcoding
Software video transcoding
Highest load
```

This is a practical hierarchy, not a fixed benchmark. Actual CPU use depends on:

- source codec and resolution
- target codec and resolution
- bitrate
- frame rate
- subtitles and burn-in filters
- HDR tone mapping
- hardware acceleration support
- driver and device configuration
- number of simultaneous streams
- the server's storage and network activity

### Direct Play CPU behaviour

Direct Play still requires the server to:

- read the file from storage
- send it over the network
- maintain the Jellyfin session
- update playback progress
- serve metadata and artwork

That usually causes only modest activity.

Sustained high CPU during supposed Direct Play is a reason to verify the active session rather than assume the label is correct or that Jellyfin is the only busy process.

### Direct Stream CPU behaviour

Direct Stream normally adds container repackaging and delivery work.

On a healthy server this is usually lightweight. A Direct Stream session that plays smoothly with low server load does not normally need fixing.

### Video-transcoding CPU behaviour

Software video transcoding can use several CPU cores continuously, particularly with:

- 4K HEVC sources
- high frame rates
- subtitle burn-in
- scaling
- HDR tone mapping
- several concurrent sessions

Hardware acceleration moves much of that work to a GPU or dedicated media engine. It can make required conversion practical, but it does not remove the reason the client needed conversion.

---

## Playback evidence to record

Use the same file, scene, client, user, and quality setting for each comparison.

Record:

```text
Client:
Connection: local or remote
Container:
Video codec and profile:
Audio codec:
Subtitle format:
Resolution:
Bitrate:
Selected quality:
Playback mode:
Reported conversion reason:
Hardware acceleration active: yes / no / unknown
Playback smooth: yes / no
```

Change one variable at a time.

Examples:

- disable subtitles, then replay the same scene
- select a different audio track, then replay
- switch local quality to Original, then replay
- use another client with the same file

This prevents several changes from hiding the real cause.

---

## How to check the playback mode

While the file is playing:

1. Open Jellyfin in a browser.
2. Go to **Dashboard**.
3. Find the active playback session.
4. Check whether it says **Direct Play**, **Direct Stream**, or **Transcoding**.
5. Read the stream and conversion details.
6. Record every stated reason before changing settings.

Common reasons include:

```text
Video codec not supported
Audio codec not supported
Subtitle burn-in required
Bitrate exceeds client limit
Resolution not supported
Container not supported
Remote bandwidth limit
HDR or tone-mapping conversion required
```

Menu wording can vary slightly between Jellyfin versions and clients, but the required evidence remains the same.

---

## Why Jellyfin transcodes instead of Direct Playing

### The video codec or profile is unsupported

A client may support H.264 but not HEVC, AV1, a specific HEVC profile, 10-bit video, or the source pixel format.

A device advertised as “4K” does not automatically support every 4K codec, profile, HDR format, or bitrate.

### The selected audio track is unsupported

The video can remain compatible while Jellyfin converts the audio.

Common problem formats include:

- DTS
- DTS-HD
- TrueHD
- some EAC3 combinations
- multichannel formats unsupported by the television or receiver

Try another track if the file contains AAC or AC3 compatibility audio.

### Subtitles require burn-in

Some clients cannot render the selected subtitle track directly.

Jellyfin may then decode the video, draw the subtitles into every frame, and encode a new video stream.

This can turn an otherwise easy Direct Play session into a heavy video transcode.

Test with subtitles disabled. If the mode changes, use [Jellyfin Subtitles Causing Transcoding](/guides/jellyfin-subtitles-causing-transcoding/).

### The client quality limit is below the source bitrate

A local client set to a lower quality may force Jellyfin to create a smaller stream even when the network could carry the original file.

For local playback, test with:

```text
Original
```

Do not raise remote limits beyond what the server's upload connection and the viewer's download connection can sustain.

### Remote bandwidth is limited

A 4K remux may Direct Play on the local network but require conversion when viewed remotely.

In that case the file and client may both be compatible. The limiting factor is the connection.

### The browser has narrower support than a native app

A file that transcodes in a browser may Direct Play in:

- Jellyfin Media Player
- an Android TV or Google TV app
- a maintained smart-TV app
- another native client

Do not judge the entire server or library using browser playback alone.

### Only the container is incompatible

If the codecs are compatible but the original container is not, Jellyfin may Direct Stream rather than transcode the video.

This is usually an acceptable lightweight fallback.

---

## Practical playback matrix

These are diagnostic examples, not guarantees for every client.

| Source and client situation | Likely mode | Why |
|---|---|---|
| H.264 + AAC in MP4 on a compatible client | Direct Play | Complete combination is supported |
| H.264 + AAC in MKV where the client rejects MKV | Direct Stream | Codecs work; container is repackaged |
| HEVC Main 10 on a client without HEVC support | Video transcoding | Video codec/profile must be converted |
| Compatible video with unsupported TrueHD track | Audio transcoding or Direct Stream with audio conversion | Video remains unchanged; audio is converted |
| Compatible video and audio with PGS subtitle burn-in | Video transcoding | Subtitle rendering requires new video frames |
| High-bitrate 4K file over a restricted remote connection | Video transcoding | Bitrate or resolution is reduced |
| Same file on a stronger native client | Direct Play or Direct Stream | Client capability removes the conversion trigger |

The same media file can use different playback modes on different clients.

---

## Worked diagnosis 1: subtitles trigger full video transcoding

Initial observation:

```text
File: MKV
Video: HEVC Main 10
Audio: AC3
Subtitles: PGS enabled
Client quality: Original
Result: Transcoding
```

Test sequence:

1. Replay with PGS subtitles enabled: video transcodes.
2. Disable subtitles and replay the same scene.
3. Session changes to Direct Play.

Conclusion:

```text
Video codec was compatible: yes
Audio codec was compatible: yes
Transcode trigger: PGS subtitle burn-in
Server upgrade required: no
```

The appropriate fix is a compatible subtitle track or a client that can render the original subtitles, not a larger CPU.

---

## Worked diagnosis 2: one client transcodes and another Direct Plays

Initial observation:

```text
File: MKV
Video: H.264
Audio: AAC
Client A: web browser
Result A: Direct Stream or Transcoding
Client B: native Jellyfin client
Result B: Direct Play
```

Conclusion:

```text
Server can deliver the original file: yes
File is broadly compatible: yes
Difference: client container or codec support
```

A client change is more targeted than converting the whole library.

---

## Worked diagnosis 3: local Direct Play but remote transcoding

Initial observation:

```text
Source: high-bitrate 4K HEVC
Local client quality: Original
Local result: Direct Play
Remote client limit: lower than source bitrate
Remote result: Transcoding
```

Conclusion:

```text
File compatibility problem: no
Local network problem: no
Remote trigger: bandwidth or quality limit
```

Appropriate options include:

- accept hardware-accelerated remote transcoding
- reduce the remote quality target
- keep a smaller secondary version
- improve available upload bandwidth where possible

---

## Direct Play vs transcoding quality

### Direct Play

Direct Play preserves the original streams.

Jellyfin is not generating a new video representation, so the client receives the source quality.

### Direct Stream

Direct Stream normally preserves the original video quality because the video is not re-encoded.

The container or delivery method changes, not the visual content.

### Transcoding

A video transcode creates a new stream.

Quality depends on:

- target bitrate
- target resolution
- source quality
- software or hardware encoder
- encoder settings
- tone mapping
- client limits
- network conditions

A well-configured transcode can look very good. It is still not identical to the original stream.

Audio conversion can also change codec, channel layout, bitrate, or passthrough behaviour.

---

## Best formats for Direct Play

There is no single format guaranteed to Direct Play on every Jellyfin client.

A broad compatibility target is:

```text
Container: MP4 or MKV
Video:     H.264
Audio:     AAC or AC3
Subtitles: External SRT
```

For storage-efficient 4K libraries:

```text
Container: MKV
Video:     HEVC Main 10
Audio:     original track plus a compatible fallback where useful
Subtitles: text subtitles where possible
```

HEVC saves space but requires compatible clients. The correct target depends on the actual devices used in the household.

Read [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/) before converting a library.

---

## How to reduce unnecessary transcoding

Use this order.

### 1. Read the dashboard reason

Do not begin with hardware changes or file conversion.

Identify the exact stream or setting that triggered conversion.

### 2. Set local quality to Original

A low client quality limit can force an unnecessary local transcode.

### 3. Disable subtitles

If playback changes to Direct Play, subtitle handling is the cause.

### 4. Select another audio track

A compatibility track can remove audio conversion without changing the video.

### 5. Test another client

If another client Direct Plays the same file, the difference is client support or client configuration.

See [Best Cheap Jellyfin Client for Direct Play](/guides/best-cheap-jellyfin-client-direct-play/).

### 6. Inspect the media

Use `ffprobe`:

```bash
ffprobe -hide_banner "Film Name.mkv"
```

Check:

- container
- video codec and profile
- pixel format
- audio tracks
- subtitle tracks
- resolution
- frame rate
- bitrate

### 7. Check remote limits

Compare the source bitrate with:

- Jellyfin client quality limit
- home upload speed
- remote download speed
- Wi-Fi or mobile network conditions

### 8. Configure hardware acceleration only when conversion remains necessary

Hardware acceleration is an optimisation for required conversion.

It is not the first diagnostic step.

---

## Can Jellyfin be forced to Direct Play?

Not reliably when the client cannot decode the original media.

You can encourage Direct Play by:

- using a client that supports the library
- setting local quality to Original
- selecting compatible audio
- using text subtitles where practical
- avoiding unnecessary remote bitrate restrictions
- keeping media in formats supported by important clients

Disabling transcoding does not add codec support to the client. It usually causes incompatible playback to fail.

The goal is to remove the actual conversion trigger, not to force a label.

---

## When hardware transcoding is useful

Hardware transcoding is useful when:

- remote bandwidth requires smaller streams
- several users have different client capabilities
- parts of the library cannot Direct Play on important devices
- subtitle burn-in cannot be avoided
- 4K content occasionally requires conversion
- the server has a supported Intel, AMD, or NVIDIA media engine

A practical rule is:

```text
Direct Play when possible
Accept Direct Stream when harmless
Use hardware transcoding for genuine compatibility or bandwidth needs
```

Check the logs and active FFmpeg process to confirm that the configured hardware path is actually being used.

Follow [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) for configuration guidance.

---

## When transcoding is acceptable

Transcoding is acceptable when:

- it solves a real client or bandwidth limitation
- playback remains smooth
- the server stays within reasonable CPU, GPU, temperature, and power limits
- other users are not affected
- the reason is understood
- the resulting quality is acceptable

Investigate when:

- a normally compatible local file suddenly transcodes
- CPU remains heavily loaded
- playback buffers
- temperatures or fan noise increase sharply
- several users cannot stream simultaneously
- subtitles unexpectedly trigger video conversion
- hardware acceleration is configured but software encoding is still used

Do not replace the server because one unusual file transcodes.

---

## SmallGrid verification method

SmallGrid evaluates playback by comparing the same file across clients and changing one variable at a time.

A reusable test set should include:

- 1080p H.264 + AAC in MP4
- 1080p H.264 + AC3 in MKV
- 1080p HEVC Main 10 in MKV
- 4K HEVC Main 10 HDR
- external SRT subtitles
- embedded ASS or SSA subtitles
- embedded PGS subtitles
- a high-bitrate local sample

For each test, record:

- Direct Play, Direct Stream, or Transcoding
- stated Jellyfin reason
- video conversion
- audio conversion
- subtitle burn-in
- approximate server load
- buffering or playback issues

This is more reliable than using generic codec-support claims as proof that a particular file will Direct Play.

---

## Quick troubleshooting checklist

If Jellyfin buffers or uses too much CPU:

1. Play the problem file on the problem client.
2. Open the Jellyfin dashboard.
3. Record Direct Play, Direct Stream, or Transcoding.
4. Record every stated conversion reason.
5. Set local quality to Original.
6. Disable subtitles and replay.
7. Select another audio track and replay.
8. Test the same file on another client.
9. Inspect the file with `ffprobe`.
10. Compare source bitrate with remote limits.
11. Check logs and hardware acceleration only if video conversion remains necessary.

Stop changing variables when the playback mode changes. The last change identifies the likely trigger.

---

## Related guides

- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/)
- [Jellyfin Direct Stream vs Direct Play](/guides/jellyfin-direct-stream-vs-direct-play/)
- [Jellyfin Subtitles Causing Transcoding](/guides/jellyfin-subtitles-causing-transcoding/)
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Best Cheap Jellyfin Client for Direct Play](/guides/best-cheap-jellyfin-client-direct-play/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Pass an Intel GPU Through to Jellyfin in Proxmox](/guides/pass-intel-gpu-through-jellyfin-proxmox/)
- [Best Mini PC Specs for Jellyfin](/guides/best-mini-pc-specs-for-jellyfin/)
- [Jellyfin on Ubuntu: Low-Power Setup](/guides/jellyfin-ubuntu-low-power/)

---

## Recap

**Direct Play** sends the original media and normally uses the least server CPU.

**Direct Stream** repackages compatible streams and is usually a lightweight, quality-preserving fallback.

**Transcoding** converts audio, video, resolution, bitrate, subtitles, or several of these. Video conversion uses the most server resources and can change quality.

Use the Jellyfin dashboard to identify the playback mode and conversion reason. Fix the specific client, subtitle, audio, quality, format, or bandwidth issue before changing server hardware.
