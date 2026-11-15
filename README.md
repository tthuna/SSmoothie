# Smoothie

A calm dark theme for the Steam client, made for [Millennium](https://steambrew.app).

- Flat neutral surfaces and thin borders instead of Steam's blue-grey
- Taller game list rows with cover art
- The selected game's art as a soft blurred backdrop, crossfading between games
- Frosted play bar and menus

## Install

1. Install [Millennium](https://steambrew.app) and launch Steam once.
2. On this page, click **Code > Download ZIP** and extract it.
3. Double-click `install.cmd` in the extracted folder.
4. Restart Steam, open Millennium settings > Themes and select **Smoothie**.

To update, download the ZIP again and run `install.cmd` again.

## Uninstall

Select another theme in Millennium, then delete `Steam\millennium\themes\smoothie`.

## Development

No build step: edit `libraryroot.custom.css` / `libraryroot.custom.js` and restart Steam.
`libraryroot.custom.js` remaps Steam's own colors at runtime, so the theme follows Steam updates.

```sh
node tests/color.test.mjs
```

## Support
Smoothie is free. If you like it, you can [buy me a coffee on Ko-fi](https://ko-fi.com/tthunadev).
