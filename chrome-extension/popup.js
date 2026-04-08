// popup.js — main controller for the extension popup

let extractedProfile = null;

const $ = id => document.getElementById(id);

// ── Logging ──────────────────────────────────────────────────────────
function log(message, type = 'info') {
  const logEl = $('log');
  logEl.classList.add('visible');
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  const icons = { success: '✓', error: '✗', info: '→', muted: '·' };
  line.textContent = `${icons[type] || '·'} ${message}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  const logEl = $('log');
  logEl.innerHTML = '';
  logEl.classList.remove('visible');
}

// ── Storage ───────────────────────────────────────────────────────────
function saveSettings() {
  chrome.storage.local.set({
    ghRepo: $('gh-repo').value,
    ghToken: $('gh-token').value,
    anthropicKey: $('anthropic-key').value
  });
}

function loadSettings() {
  chrome.storage.local.get(['ghRepo', 'ghToken', 'anthropicKey'], data => {
    if (data.ghRepo) $('gh-repo').value = data.ghRepo;
    if (data.ghToken) $('gh-token').value = data.ghToken;
    if (data.anthropicKey) $('anthropic-key').value = data.anthropicKey;
  });
}

// ── LinkedIn tab detection ────────────────────────────────────────────
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    const isLinkedIn = tab?.url?.includes('linkedin.com/in/');
    const badge = $('status-badge');
    const statusText = $('status-text');
    const extractBtn = $('btn-extract');

    if (isLinkedIn) {
      badge.className = 'status-badge on-linkedin';
      statusText.textContent = 'LinkedIn profile detected — ready to extract';
      extractBtn.disabled = false;
    } else {
      badge.className = 'status-badge off-linkedin';
      statusText.textContent = 'Navigate to your LinkedIn profile to begin';
      extractBtn.disabled = true;
    }
  });
}

// ── Profile preview ───────────────────────────────────────────────────
function showPreview(profile) {
  $('preview-name').textContent = profile.basics?.name || 'Unknown';
  $('preview-title').textContent = [profile.basics?.title, profile.basics?.company].filter(Boolean).join(' · ');
  $('preview-certs').textContent = profile.certifications?.length || 0;
  $('preview-pubs').textContent = profile.publications?.length || 0;
  $('preview-proj').textContent = profile.projects?.length || 0;
  $('preview-exp').textContent = profile.experience?.length || 0;
  $('profile-preview').classList.add('visible');
}

// ── Extract ───────────────────────────────────────────────────────────
async function extractProfile() {
  clearLog();
  const btn = $('btn-extract');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Extracting...';
  log('Reading LinkedIn profile DOM...', 'info');

  try {
    const tabs = await new Promise(res => chrome.tabs.query({ active: true, currentWindow: true }, res));
    const tab = tabs[0];

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' }, res => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    if (!response.success) throw new Error(response.error);

    const rawProfile = response.profile;
    log(`Extracted raw data — ${Object.keys(rawProfile).length} sections found`, 'success');

    const anthropicKey = $('anthropic-key').value.trim();

    if (anthropicKey) {
      log('Cleaning data with Claude AI (Haiku)...', 'info');
      extractedProfile = await Parser.structureProfile(rawProfile, anthropicKey);
      log('AI structuring complete', 'success');
    } else {
      log('No Anthropic key — using raw extraction fallback', 'muted');
      extractedProfile = Parser.structureProfileFallback(rawProfile);
    }

    showPreview(extractedProfile);
    log(`Ready: ${extractedProfile.basics.name} · ${extractedProfile.certifications.length} certs · ${extractedProfile.publications.length} pubs`, 'success');

    $('btn-push').disabled = false;
    $('btn-download').disabled = false;
    saveSettings();

  } catch (err) {
    log(`Error: ${err.message}`, 'error');
    if (err.message.includes('Could not establish connection')) {
      log('Try refreshing your LinkedIn profile tab', 'muted');
    }
  }

  btn.disabled = false;
  btn.innerHTML = 'Extract LinkedIn Profile';
}

// ── Push to GitHub ────────────────────────────────────────────────────
async function pushToGitHub() {
  if (!extractedProfile) { log('Extract profile first', 'error'); return; }

  const token = $('gh-token').value.trim();
  const repo = $('gh-repo').value.trim();

  if (!token) { log('Enter your GitHub token', 'error'); return; }
  if (!repo) { log('Enter your GitHub repo (e.g. username/username)', 'error'); return; }

  const btn = $('btn-push');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner dark"></span> Pushing...';

  try {
    log(`Validating GitHub token for ${repo}...`, 'info');
    const valid = await GitHub.validateToken(token, repo);
    if (!valid) throw new Error('Invalid token or repo not found');
    log('Token valid', 'success');

    log('Pushing profile.json to GitHub...', 'info');
    const result = await GitHub.pushProfileJson(token, repo, extractedProfile);
    const sha = result.commit?.sha?.slice(0, 7);

    log(`Pushed successfully — commit ${sha}`, 'success');
    log('GitHub Action will now trigger README update automatically', 'success');
    log(`View at github.com/${repo}`, 'muted');

    saveSettings();
  } catch (err) {
    log(`Push failed: ${err.message}`, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = 'Push profile.json to GitHub';
}

// ── Download ──────────────────────────────────────────────────────────
function downloadProfile() {
  if (!extractedProfile) { log('Extract profile first', 'error'); return; }
  const blob = new Blob([JSON.stringify(extractedProfile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profile.json';
  a.click();
  URL.revokeObjectURL(url);
  log('Downloaded profile.json', 'success');
}

// ── Event listeners ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkCurrentTab();

  $('btn-extract').addEventListener('click', extractProfile);
  $('btn-push').addEventListener('click', pushToGitHub);
  $('btn-download').addEventListener('click', downloadProfile);

  // Auto-save settings on input
  ['gh-repo', 'gh-token', 'anthropic-key'].forEach(id => {
    $(id).addEventListener('change', saveSettings);
  });
});

// Refresh tab status when popup opens
chrome.tabs.onActivated?.addListener(checkCurrentTab);
