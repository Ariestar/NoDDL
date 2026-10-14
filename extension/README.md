# NoDDL Session Bridge

This MV3 extension gives the NoDDL userscript access to the platform's HttpOnly `educg_session` cookie through Chrome's native Cookies API. It does not store passwords or add a page UI.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension` directory.
4. Keep the ordinary Tampermonkey extension enabled for the NoDDL userscript.
5. Reload `http://115.156.107.145/` and trigger automatic sync.

The extension only requests cookie access for `http://115.156.107.145/*` and only returns `educg_session` to the NoDDL userscript.
