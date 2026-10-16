# NoDDL Chrome Extension

This MV3 extension contains the NoDDL page assistant and reads the platform's HttpOnly `educg_session` cookie through Chrome's native Cookies API. It does not store passwords or add a page UI.

## Download and install

If you own the source repository, import `Ariestar/NoDDL` from Cloudflare Workers & Pages. Otherwise, use the **Deploy to Cloudflare** button to clone the public template into your account. Then download the [latest extension release](https://github.com/Ariestar/NoDDL/releases/latest). The release contains no public service address; enter your own Worker URL in the extension's advanced settings.

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension` directory.
4. Reload `http://115.156.107.145/`.

The extension only requests cookie access for the course platform. API requests go to your configured Cloudflare Worker, and only `educg_session` is returned to the assistant runtime.

After entering your Worker URL, the extension binds the current course session automatically when you open a course page. Background sync and the CalDAV calendar use that same Worker URL.
