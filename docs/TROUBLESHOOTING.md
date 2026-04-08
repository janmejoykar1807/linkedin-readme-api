# Troubleshooting

## Extension Issues

### "Could not establish connection" error
- Refresh your LinkedIn profile tab
- Make sure you're on `linkedin.com/in/your-profile` (not the feed or jobs page)
- Reload the extension at `chrome://extensions`

### Extraction returns empty sections
- Scroll through your full LinkedIn profile first so all sections render
- Manually click "Show all" on sections like Certifications and Publications
- Wait a few seconds, then extract again

### Publication URL shows "—" in README
- Make sure the publication has a link added on your LinkedIn profile
- The "Show publication" button must be visible on the page before extraction

---

## GitHub Action Issues

### "Cannot find module update_readme.js"
- Upload `update_readme.js` to the **root** of your repo (not inside any folder)

### YAML syntax error on line 46
- Re-download the latest `readme_sync.yml` — older versions had inline JS causing YAML conflicts

### "Resource not accessible by integration"
- Your workflow is missing `permissions: contents: write` — check the yml file

### GitHub Models returns 401 Unauthorized
- Accept the GitHub Models beta at [github.com/marketplace/models](https://github.com/marketplace/models)
- The `GITHUB_TOKEN` is auto-injected — you don't need to create a secret

### README sections not updating
- Check that the SVG banner filenames in your README exactly match the regex patterns in `update_readme.js`
- Custom banner paths need to be updated in the replace() calls in `update_readme.js`

---

## Profile.json Issues

### Wrong data extracted
- LinkedIn's DOM changes frequently — selectors may need updating in `content.js`
- Use the Anthropic API key option to let Claude AI clean and re-structure raw data

### Authors missing from publications
- Authors are not always in the LinkedIn DOM — add them manually to `profile.json`

---

## Still stuck?

Open an issue at [github.com/janmejoykar1807/linkedin-readme-api/issues](https://github.com/janmejoykar1807/linkedin-readme-api/issues)
