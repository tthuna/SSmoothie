# Smoothie

A calm dark theme for the Steam client, made for [Millennium](https://steambrew.app).

- Flat neutral surfaces and thin borders instead of Steam's blue-grey
- Taller game list rows with cover art
- The selected game's art as a soft blurred backdrop, crossfading between games
- Frosted play bar and menus

## Install

1. Install [Millennium](https://steambrew.app) and launch Steam once.
2. Install Smoothie, either way:
   - **Script** (PowerShell):
     ```powershell
     irm https://raw.githubusercontent.com/tthuna/SSmoothie/main/install.ps1 | iex
     ```
   - **Manual**: download the [ZIP](https://github.com/tthuna/SSmoothie/archive/refs/heads/main.zip), extract it and rename the folder to `smoothie`, then move it to `Steam\millennium\themes\`.
3. Restart Steam, open Millennium settings > Themes and select **Smoothie**.

Run the script again to update.

## Uninstall

Select another theme in Millennium, then delete `Steam\millennium\themes\smoothie`.

## Development

No build step: edit `libraryroot.custom.css` / `libraryroot.custom.js` and restart Steam.
`libraryroot.custom.js` remaps Steam's own colors at runtime, so the theme follows Steam updates.

```sh
node tests/color.test.mjs
```
