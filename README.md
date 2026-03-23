# Homepage Backdrop

A Jellyfin plugin that cycles backdrop images on the homepage using items from **all media libraries** — not just movies, series, and books as the default implementation does.

## Features

- Fetches random items with backdrop images from every library (movies, series, music, photos, books, etc.)
- Cycles through backdrops every 10 seconds with the native fade-in animation
- Respects the standard **Backdrops** user display setting — only activates when enabled
- Pauses rotation while a video is playing locally
- Only runs on the homepage; other pages use their normal backdrop behavior
- Works with both legacy and experimental Jellyfin web clients

## Installation

### Manual Install

1. Download the latest `SonnyTel.Plugin.HomepageBackdrop.dll` from the [Releases](https://github.com/sonny-tel/jellyfin-homepage-backdrop/releases) page.
2. Create a folder named `HomepageBackdrop` inside your Jellyfin `plugins` directory.
3. Copy the DLL into that folder.
4. Restart Jellyfin.

### Enable Backdrops

The plugin uses the existing Jellyfin user setting:

1. Go to **Settings → Display**.
2. Check **Backdrops** under the Libraries section.
3. Save. The homepage will now cycle through backdrops from all your media.

## How It Works

The plugin injects a small client-side script into the Jellyfin web interface that:

1. Detects when you're on the homepage
2. Checks if the **Backdrops** display setting is enabled for your user
3. Queries the Jellyfin API for up to 20 random items with backdrop images (from all libraries)
4. Rotates through them every 10 seconds using the same CSS animation as the native backdrop system

No additional configuration is needed beyond enabling the Backdrops setting.

## Building

```bash
dotnet build --configuration Release
```

The compiled DLL will be in `SonnyTel.Plugin.HomepageBackdrop/bin/Release/net9.0/`.

## Requirements

- Jellyfin Server 10.11.x or later

## License

This project is licensed under the GPL-3.0 License.

