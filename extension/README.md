# NoDDL Chrome Extension

This MV3 extension contains the NoDDL page assistant and reads the platform's HttpOnly `educg_session` cookie through Chrome's native Cookies API. It does not store passwords or add a page UI.

## Download and install

Deploy your own Worker first, then download the `NoDDL-extension-self-hosted` artifact from your Fork's latest successful **Deploy to Cloudflare** workflow. New Forks must first enable workflows from the **Actions** page. The build contains your Worker URL and never uses a shared public service.

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension` directory.
4. Reload `http://115.156.107.145/`.

The extension only requests cookie access for the course platform. API requests go to your configured Cloudflare Worker, and only `educg_session` is returned to the assistant runtime.
