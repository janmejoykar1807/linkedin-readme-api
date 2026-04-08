# LinkedIn → GitHub README Sync

> **Automatically sync your LinkedIn profile to your GitHub README — for free.**
> Built by [Janmejoy Kar](https://github.com/janmejoykar1807) · Personal Use License

---

## What This Does

A Chrome Extension that reads your LinkedIn profile directly from your browser, converts it into a structured `profile.json`, and pushes it to your GitHub profile repo. A GitHub Action then uses GitHub Models (free AI) to intelligently update only the relevant sections of your README — preserving all your custom SVG banners, badges, and animations.

```
You visit LinkedIn profile
    → Click Chrome Extension
        → Extracts profile data from DOM
            → Pushes profile.json to GitHub
                → GitHub Action fires automatically
                    → GitHub Models AI rewrites sections
                        → README updated ✓
```

---

## Features

- **Zero cost** — uses GitHub Models (free), GitHub Actions (free), GitHub API (free)
- **Non-invasive** — reads only your own LinkedIn profile DOM, no LinkedIn API calls
- **Surgical updates** — only rewrites Experience, Projects, Certifications, Publications
- **Preserves design** — SVG banners, badges, animations untouched
- **Publication links** — extracts DOI/journal URLs from LinkedIn publication entries
- **No scheduling** — runs only when you choose to sync

---

## Project Structure

```
linkedin-readme-api/
├── LICENSE                          ← Personal use license
├── README.md                        ← This file
├── profile.json                     ← Your LinkedIn profile data (auto-generated)
├── update_readme.js                 ← Node.js script run by GitHub Action
│
├── chrome-extension/                ← Load this in Chrome
│   ├── manifest.json
│   ├── content.js                   ← LinkedIn DOM extractor
│   ├── popup.html                   ← Extension UI
│   ├── popup.js                     ← Main controller
│   ├── parser.js                    ← Claude AI data cleaner (optional)
│   ├── github.js                    ← GitHub API push handler
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── .github/
│   └── workflows/
│       └── readme_sync.yml          ← GitHub Action workflow
│
├── docs/
│   ├── SETUP.md                     ← Step-by-step setup guide
│   ├── PROFILE_JSON.md              ← profile.json schema reference
│   └── TROUBLESHOOTING.md          ← Common issues and fixes
│
└── scripts/
    └── push_to_github.py            ← Python script to push all files to GitHub
```

---

## Quick Start

### 1. Clone or download this repo

```bash
git clone https://github.com/janmejoykar1807/linkedin-readme-api.git
```

### 2. Set up the Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `chrome-extension/` folder

### 3. Add workflow files to your GitHub profile repo

Upload these to your `username/username` repo:
- `profile.json` → repo root
- `update_readme.js` → repo root
- `.github/workflows/readme_sync.yml` → in that exact path

### 4. Configure the extension

Open the extension popup and enter:
- **GitHub repo**: `your-username/your-username`
- **GitHub token**: [Generate here](https://github.com/settings/tokens/new?scopes=repo) (needs `repo` scope)
- **Anthropic API key**: Optional — used for AI data cleanup

### 5. Sync your profile

1. Visit `linkedin.com/in/your-profile`
2. Click the extension → **Extract LinkedIn Profile**
3. Review the preview panel
4. Click **Push profile.json to GitHub**
5. GitHub Action fires → README updates in ~60 seconds

---

## How the GitHub Action Works

The workflow (`readme_sync.yml`) triggers on every push to `profile.json` and:

1. Checks out your repo
2. Reads `profile.json` and your current `README.md`
3. Calls **GitHub Models** (`gpt-4o-mini`) — completely free with your GitHub token
4. AI updates only: Experience, Projects, Certifications, Publications sections
5. Commits the updated README back as `github-actions[bot]`

**Cost: $0.00** — GitHub Models is free for personal accounts.

---

## profile.json Schema

```json
{
  "basics": {
    "name": "Your Name",
    "title": "Your Title",
    "company": "Your Company",
    "location": "City, State",
    "bio": "Your bio text",
    "linkedinUrl": "https://linkedin.com/in/your-profile",
    "githubUrl": "https://github.com/your-username",
    "email": "your@email.com"
  },
  "publications": [
    {
      "title": "Paper Title",
      "journal": "Journal Name",
      "year": "2025",
      "authors": "Author 1, Author 2",
      "url": "https://doi.org/...",
      "doi": "http://doi.one/...",
      "contribution": "Your role"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuer",
      "date": "Jan 2025",
      "status": "active | in-progress | expired"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": "Python, React, etc.",
      "description": "What it does",
      "url": "https://github.com/...",
      "visibility": "public | private"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company",
      "duration": "Jan 2024 – Present",
      "location": "City, State",
      "description": "What you did",
      "tech": "Tools used"
    }
  ],
  "education": [
    {
      "degree": "M.S. Business Analytics",
      "school": "University of North Texas",
      "years": "2022–2024"
    }
  ],
  "skills": ["Python", "R", "PySpark"],
  "languages": [
    { "language": "English", "proficiency": "Professional" }
  ],
  "meta": {
    "extractedAt": "2026-04-08T00:00:00.000Z",
    "sourceUrl": "https://linkedin.com/in/your-profile",
    "version": "1.0"
  }
}
```

---

## Cost Breakdown

| Component | Cost |
|---|---|
| Chrome Extension | Free |
| GitHub API | Free |
| GitHub Actions (2,000 min/month) | Free |
| GitHub Models (gpt-4o-mini) | Free |
| Anthropic API (optional cleanup) | ~$0.001/run |
| **Total** | **$0.00 / month** |

---

## Limitations

- LinkedIn does not provide a public API — this tool reads your browser's rendered DOM
- "Show all" sections must be expanded before extraction for best results
- Publication URLs require the link to be added on your LinkedIn profile
- GitHub Models availability requires accepting the beta at [github.com/marketplace/models](https://github.com/marketplace/models)

---

## License

This project is licensed under a **Personal Use License**. See [LICENSE](./LICENSE) for full terms.

- ✅ Personal use allowed
- ✅ Fork and adapt for your own profile
- ❌ Commercial use not permitted
- ❌ Redistribution as a product not permitted

---

## Author

**Janmejoy Kar**
Data Scientist · Microsoft Fabric · Power BI · PySpark

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0d1117?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/janmejoy-kar-849756196)
[![GitHub](https://img.shields.io/badge/GitHub-0d1117?style=flat&logo=github&logoColor=white)](https://github.com/janmejoykar1807)
[![Portfolio](https://img.shields.io/badge/Portfolio-0d1117?style=flat&logo=vercel&logoColor=white)](https://janmejoykar-portfolio.vercel.app)
