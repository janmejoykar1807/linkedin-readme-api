# Setup Guide

## Prerequisites

- Google Chrome browser
- GitHub account
- Your GitHub profile repo (`username/username`) already exists

---

## Step 1 — Install the Chrome Extension

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Toggle **Developer mode** on (top-right corner)
4. Click **Load unpacked**
5. Select the `chrome-extension/` folder from this repo
6. The extension icon appears in your Chrome toolbar

---

## Step 2 — Generate a GitHub Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Note: `LinkedIn README Sync`
3. Expiration: `No expiration` (or set as preferred)
4. Scopes: check **repo**
5. Click **Generate token**
6. Copy the token — you only see it once (`ghp_...`)

---

## Step 3 — Upload files to your profile repo

Go to `github.com/your-username/your-username` and upload:

| File | Destination |
|---|---|
| `profile.json` | repo root |
| `update_readme.js` | repo root |
| `.github/workflows/readme_sync.yml` | create path manually |

For the workflow file:
- Click **Add file → Create new file**
- Type `.github/workflows/readme_sync.yml` in the name box
- Paste the contents of `readme_sync.yml`
- Commit

---

## Step 4 — Enable GitHub Models

1. Visit [github.com/marketplace/models](https://github.com/marketplace/models)
2. Sign in and accept the beta terms if prompted
3. Your `GITHUB_TOKEN` in Actions automatically gets access

---

## Step 5 — Configure the Extension

Click the extension icon and fill in:

| Field | Value |
|---|---|
| GitHub repo | `your-username/your-username` |
| GitHub token | `ghp_...` from Step 2 |
| Anthropic API key | Optional |

Settings are saved automatically in Chrome local storage.

---

## Step 6 — Run Your First Sync

1. Navigate to `linkedin.com/in/your-profile`
2. Scroll through your profile so all sections load
3. Expand any "Show all" sections manually for best extraction
4. Click the extension → **Extract LinkedIn Profile**
5. Review the preview (name, cert count, pub count, etc.)
6. Click **Push profile.json to GitHub**
7. Go to your repo → **Actions** tab to watch it run
8. README updates within ~60 seconds

---

## Subsequent Syncs

Repeat Steps 6 whenever you update your LinkedIn profile. The extension saves your token and repo — just visit LinkedIn, click Extract, and Push.
