# NoDDL Chrome Extension

This MV3 extension contains the NoDDL page assistant and reads the platform's HttpOnly `educg_session` cookie through Chrome's native Cookies API. It does not store passwords or add a page UI.

## Download and install

For regular use, download the [latest extension release](https://github.com/Ariestar/NoDDL/releases/latest) and unzip it. The extension already points to the official NoDDL service, so no Cloudflare deployment or service URL configuration is required.

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension` directory.
4. Reload `http://115.156.107.145/`.

The extension only requests cookie access for the course platform. API requests go to the configured Cloudflare Worker, and only `educg_session` is returned to the assistant runtime.
