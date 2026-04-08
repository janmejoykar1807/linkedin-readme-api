// github.js — handles all GitHub API operations

const GitHub = {

  async getFile(token, repo, path) {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub API error: ${res.status}`);
    }
    return res.json();
  },

  async pushFile(token, repo, path, content, message, sha) {
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content)))
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub push error: ${res.status}`);
    }
    return res.json();
  },

  async pushProfileJson(token, repo, profileJson) {
    const path = 'profile.json';
    const content = JSON.stringify(profileJson, null, 2);
    const date = new Date().toISOString().split('T')[0];
    const message = `chore: sync profile.json from LinkedIn — ${date}`;

    // Check if file already exists (to get SHA for update)
    const existing = await this.getFile(token, repo, path);
    const sha = existing ? existing.sha : undefined;

    return this.pushFile(token, repo, path, content, message, sha);
  },

  async validateToken(token, repo) {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    return res.ok;
  }
};
