// update_readme.js — surgically updates specific sections of Janmejoy's GitHub README
// Sections managed: Experience, Projects, Certifications, Publications
// Sections never touched: About, Numbers, Stack, Competitions, Community, GitHub stats

const fs = require('fs');
const https = require('https');

function readFile(path, fallback = '') {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf-8') : fallback;
}

function callGitHubModels(prompt) {
  const requestBody = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a GitHub README section generator. Return only the exact markdown requested — no explanation, no code fences, no preamble.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.2
  });

  const options = {
    hostname: 'models.inference.ai.azure.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN,
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error('GitHub Models error: ' + parsed.error.message));
          else resolve(parsed.choices[0].message.content.trim());
        } catch (e) {
          reject(new Error('Parse error: ' + e.message + ' — Response: ' + data.slice(0, 300)));
        }
      });
    });
    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

// 1. Experience — plain text format with <br/> descriptions
async function generateExperience(profile) {
  const entries = (profile.experience || []).map(e =>
    '**' + e.title + '** — ' + e.company + ' *(' + e.duration + ')*\n<br/>' + (e.description || '')
  ).join('\n\n');

  return callGitHubModels(
    'Rewrite these work experience entries to match this exact GitHub README style:\n\n'
    + 'EXAMPLE:\n'
    + '**Data Scientist** — Group O *(Jan 2024 → Present)*\n'
    + '<br/>Architecting end-to-end analytics across Microsoft Fabric, Databricks & AWS. Built forecasting models (+30% accuracy).\n\n'
    + 'ENTRIES:\n' + entries + '\n\n'
    + 'Rules: Bold title, em dash, company, italic duration in parens. <br/> before description. One concise impact-focused line. Return only formatted entries.'
  );
}

// 2. Projects — 2-column HTML table
async function generateProjects(profile) {
  return callGitHubModels(
    'Generate a GitHub README projects table in this EXACT format:\n\n'
    + '<div align="center">\n<table>\n<tr>\n<td width="50%">\n\n'
    + '**[🩺 Project Name](https://github.com/url)**\n<br/>Short description.\n<br/><sub>Tech · Stack</sub>\n\n'
    + '</td>\n<td width="50%">\n\n**[⛏️ Project](url)**\n<br/>Description.\n<br/><sub>Tech</sub>\n\n</td>\n</tr>\n</table>\n</div>\n\n'
    + 'PROJECTS:\n' + JSON.stringify(profile.projects || [], null, 2) + '\n\n'
    + 'Rules: Relevant emoji per project. If URL is empty or private, omit hyperlink, just bold name. 2 projects per row. Return only the table.'
  );
}

// 3. Certifications — pipe table
function generateCertifications(profile) {
  const rows = (profile.certifications || []).map(c => {
    const status = c.status === 'in-progress' ? '(In Progress)' : '(Active)';
    const year = c.date ? c.date.slice(0, 4) : '';
    return '| **' + c.name + '** | ' + c.issuer + ' | ' + year + ' ' + status + ' |';
  }).join('\n');
  return '| Certification | Issuer | Year |\n|:---|:---|:---:|\n' + rows;
}

// 4. Publications — pipe table with Title, Journal, Authors, Year
function generatePublications(profile) {
  const rows = (profile.publications || []).map(p => {
    const title = '**' + p.title + '**';
    const link = p.url ? '[📄 View](' + p.url + ')' : '—';
    return '| ' + title + ' | ' + p.journal + ' | ' + (p.authors || '') + ' | ' + (p.year || '') + ' | ' + link + ' |';
  }).join('\n');
  return '| Title | Journal | Authors | Year | Link |
|:---|:---|:---|:---:|:---:|
' + rows;
}

// Main
async function main() {
  const profile = JSON.parse(readFile('profile.json'));
  let readme = readFile('README.md');
  if (!readme) { console.error('README.md not found'); process.exit(1); }

  console.log('Profile: ' + profile.basics.name);
  console.log('Exp: ' + profile.experience.length + ' | Projects: ' + profile.projects.length + ' | Certs: ' + profile.certifications.length + ' | Pubs: ' + profile.publications.length);

  // Experience
  console.log('Updating Experience...');
  const newExp = await generateExperience(profile);
  readme = readme.replace(
    /(section-work\.svg" width="100%" \/>\n\n)[\s\S]*?(?=&nbsp;\n\n<img src="https:\/\/github\.com\/janmejoykar1807\/janmejoykar1807\/blob\/main\/assets\/section-projects\.svg)/,
    '$1' + newExp + '\n\n&nbsp;\n\n'
  );

  // Projects
  console.log('Updating Projects...');
  const newProjects = await generateProjects(profile);
  readme = readme.replace(
    /(section-projects\.svg" width="100%" \/>\n\n)[\s\S]*?(?=&nbsp;\n\n<img src="https:\/\/github\.com\/janmejoykar1807\/janmejoykar1807\/blob\/main\/assets\/section-competitions\.svg)/,
    '$1' + newProjects + '\n\n&nbsp;\n\n'
  );

  // Certifications
  console.log('Updating Certifications...');
  const newCerts = generateCertifications(profile);
  readme = readme.replace(
    /(section-certs\.svg" width="100%" \/>\n\n)\| Certification[\s\S]*?(?=&nbsp;\n\n<img src="https:\/\/github\.com\/janmejoykar1807\/janmejoykar1807\/blob\/main\/assets\/section-publications\.svg)/,
    '$1' + newCerts + '\n\n&nbsp;\n\n'
  );

  // Publications
  console.log('Updating Publications...');
  const newPubs = generatePublications(profile);
  readme = readme.replace(
    /(section-publications\.svg" width="100%" \/>\n\n)\| Title[\s\S]*?(?=&nbsp;\n\n<img src="https:\/\/github\.com\/janmejoykar1807\/janmejoykar1807\/blob\/main\/assets\/section-community\.svg)/,
    '$1' + newPubs + '\n\n&nbsp;\n\n'
  );

  fs.writeFileSync('README.md', readme, 'utf-8');
  console.log('README updated — ' + readme.length + ' chars');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
