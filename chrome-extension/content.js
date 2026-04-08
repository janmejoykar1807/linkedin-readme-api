// content.js — LinkedIn profile DOM extractor
// Handles expanded sections, "Show all" buttons, and publication URLs

(function () {

  function safeText(el) {
    return el ? el.innerText.trim().replace(/\s+/g, ' ') : '';
  }

  function safeAll(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  // Click all "Show all" / "See more" buttons to expand hidden sections
  async function expandAllSections() {
    const expandSelectors = [
      'button[aria-label*="Show all"]',
      'button[aria-label*="see more"]',
      'button[aria-label*="See more"]',
      'span.lt-line-clamp__more',
      'button.inline-show-more-text__button',
      '.pv-profile-section__see-more-inline',
      'button[data-control-name="see_more"]'
    ];

    for (const sel of expandSelectors) {
      const btns = safeAll(sel);
      for (const btn of btns) {
        try { btn.click(); } catch (e) {}
      }
    }

    // Wait for DOM to update after clicks
    await new Promise(r => setTimeout(r, 1200));
  }

  // Find a section element by its anchor id or heading text
  function findSection(anchorIds) {
    for (const id of anchorIds) {
      const el = document.getElementById(id);
      if (el) {
        // Walk up to the nearest section container
        let parent = el.closest('section');
        if (parent) return parent;
        parent = el.parentElement;
        while (parent && parent.tagName !== 'SECTION') parent = parent.parentElement;
        if (parent) return parent;
      }
    }
    return null;
  }

  // Generic item extractor for list-based sections
  function extractItems(section) {
    if (!section) return [];
    return safeAll('li.artdeco-list__item, li.pvs-list__item--line-separated, li.pvs-list__paged-list-item', section);
  }

  // Get all text nodes within an element, prioritising aria-hidden spans (LinkedIn's pattern)
  function getPrimaryText(el) {
    const ariaHidden = el.querySelectorAll('span[aria-hidden="true"]');
    if (ariaHidden.length > 0) {
      return Array.from(ariaHidden).map(s => s.innerText.trim()).filter(Boolean);
    }
    return [el.innerText.trim()].filter(Boolean);
  }

  // ── Basics ──────────────────────────────────────────────────────────────────
  function extractBasics() {
    const name = safeText(document.querySelector('h1'));

    const titleEl = document.querySelector('.text-body-medium.break-words');
    const title = safeText(titleEl);

    const locationEl = document.querySelector('.pb2.pv-text-details__left-panel span.text-body-small')
      || document.querySelector('.pv-text-details__left-panel .text-body-small');
    const location = safeText(locationEl);

    // About/bio — try multiple selectors
    const aboutSection = findSection(['about']);
    let bio = '';
    if (aboutSection) {
      const bioEl = aboutSection.querySelector('.visually-hidden')
        || aboutSection.querySelector('span[aria-hidden="true"]');
      bio = safeText(bioEl);
    }

    return { name, title, location, bio, linkedinUrl: window.location.href.split('?')[0] };
  }

  // ── Experience ───────────────────────────────────────────────────────────────
  function extractExperience() {
    const section = findSection(['experience']);
    if (!section) return [];

    const items = extractItems(section);
    const results = [];

    items.forEach(item => {
      const texts = getPrimaryText(item);
      if (texts.length < 2) return;

      // LinkedIn experience: [title, company · type, duration · location, description?]
      const title = texts[0] || '';
      const companyRaw = texts[1] || '';
      const company = companyRaw.split('·')[0].trim();
      const durationRaw = texts[2] || '';
      const duration = durationRaw.split('·')[0].trim();
      const location = durationRaw.includes('·') ? durationRaw.split('·')[1].trim() : '';
      const description = texts[3] || '';

      if (title && company) {
        results.push({ title, company, duration, location, description });
      }
    });

    return results;
  }

  // ── Education ────────────────────────────────────────────────────────────────
  function extractEducation() {
    const section = findSection(['education']);
    if (!section) return [];

    const items = extractItems(section);
    const results = [];

    items.forEach(item => {
      const texts = getPrimaryText(item);
      const school = texts[0] || '';
      const degree = texts[1] || '';
      const years = texts[2] || '';
      if (school) results.push({ school, degree, years });
    });

    return results;
  }

  // ── Certifications ───────────────────────────────────────────────────────────
  function extractCertifications() {
    const section = findSection(['licenses_and_certifications', 'certifications', 'licenses-and-certifications']);
    if (!section) return [];

    const items = extractItems(section);
    const results = [];

    items.forEach(item => {
      const texts = getPrimaryText(item);
      const name = texts[0] || '';
      const issuer = texts[1] || '';
      const dateRaw = texts[2] || '';

      // Extract dates — LinkedIn shows "Issued Jan 2024 · Expires Jan 2026" or just "Issued Jan 2024"
      const issuedMatch = dateRaw.match(/Issued\s+([\w\s,]+?)(?:\s*·|$)/);
      const expiresMatch = dateRaw.match(/Expires\s+([\w\s,]+?)(?:\s*·|$)/);
      const date = issuedMatch ? issuedMatch[1].trim() : dateRaw;
      const expires = expiresMatch ? expiresMatch[1].trim() : '';

      // Determine status
      const now = new Date();
      let status = 'active';
      if (expires) {
        const expDate = new Date(expires);
        if (!isNaN(expDate) && expDate < now) status = 'expired';
      }
      if (name.toLowerCase().includes('progress') || issuer.toLowerCase().includes('progress')) {
        status = 'in-progress';
      }

      if (name) results.push({ name, issuer, date, expires, status });
    });

    return results;
  }

  // ── Publications ─────────────────────────────────────────────────────────────
  function extractPublications() {
    const section = findSection(['publications']);
    if (!section) return [];

    const items = extractItems(section);
    const results = [];

    items.forEach(item => {
      const texts = getPrimaryText(item);
      const title = texts[0] || '';
      const journalRaw = texts[1] || '';
      const dateRaw = texts[2] || '';
      const description = texts[3] || '';

      // Extract journal name — LinkedIn shows "Journal Name · Month Year"
      const journal = journalRaw.split('·')[0].trim();
      const year = dateRaw.match(/\d{4}/) ? dateRaw.match(/\d{4}/)[0] : '';

      // ── Publication URL extraction ────────────────────────────────
      // LinkedIn wraps "Show publication" span inside a parent <a> tag
      let url = '';

      // Step 1: Find "Show publication" span and walk up to its parent <a>
      const showPubSpans = safeAll('span', item);
      for (const span of showPubSpans) {
        if (span.innerText && span.innerText.trim().toLowerCase().includes('show publication')) {
          // Walk up DOM to find the nearest anchor parent
          let el = span;
          while (el && el !== item) {
            if (el.tagName === 'A' && el.href) {
              url = el.href;
              break;
            }
            el = el.parentElement;
          }
          if (url) break;
        }
      }

      // Step 2: Fallback — any anchor in the item not pointing to LinkedIn itself
      if (!url) {
        const anchors = safeAll('a[href]', item);
        for (const a of anchors) {
          const href = a.href || '';
          if (
            href &&
            !href.includes('linkedin.com/in/') &&
            !href.includes('linkedin.com/search') &&
            !href.includes('linkedin.com/pub') &&
            !href.startsWith('javascript') &&
            href.startsWith('http')
          ) {
            url = href;
            break;
          }
        }
      }

      // Step 3: Check data attributes LinkedIn sometimes uses
      if (!url) {
        const linkEl = item.querySelector('[data-field="publication_url"]')
          || item.querySelector('a[data-control-name="publication_url"]');
        if (linkEl) url = linkEl.href || '';
      }

      if (title) {
        results.push({ title, journal, year, description, url, authors: '' });
      }
    });

    return results;
  }

  // ── Projects ─────────────────────────────────────────────────────────────────
  function extractProjects() {
    const section = findSection(['projects']);
    if (!section) return [];

    const items = extractItems(section);
    const results = [];

    items.forEach(item => {
      const texts = getPrimaryText(item);
      const name = texts[0] || '';
      const dateRaw = texts[1] || '';
      const description = texts[2] || '';

      // Try to get project URL
      let url = '';
      const anchors = safeAll('a[href]', item);
      for (const a of anchors) {
        const href = a.href || '';
        if (href && !href.includes('linkedin.com') && href.startsWith('http')) {
          url = href;
          break;
        }
      }

      if (name) results.push({ name, date: dateRaw, description, url, tech: '' });
    });

    return results;
  }

  // ── Skills ───────────────────────────────────────────────────────────────────
  function extractSkills() {
    const section = findSection(['skills']);
    if (!section) return [];

    const skills = [];
    const items = extractItems(section);

    items.forEach(item => {
      const texts = getPrimaryText(item);
      const skill = texts[0] || '';
      if (skill && skill.length < 60 && !skills.includes(skill)) {
        skills.push(skill);
      }
    });

    return skills;
  }

  // ── Languages ────────────────────────────────────────────────────────────────
  function extractLanguages() {
    const section = findSection(['languages']);
    if (!section) return [];

    const items = extractItems(section);
    return items.map(item => {
      const texts = getPrimaryText(item);
      return { language: texts[0] || '', proficiency: texts[1] || '' };
    }).filter(l => l.language);
  }

  // ── Main extractor ───────────────────────────────────────────────────────────
  async function extractProfile() {
    console.log('[LinkedIn Sync] Starting extraction...');

    // Expand all collapsed sections first
    await expandAllSections();

    const profile = {
      basics: extractBasics(),
      experience: extractExperience(),
      education: extractEducation(),
      certifications: extractCertifications(),
      publications: extractPublications(),
      projects: extractProjects(),
      skills: extractSkills(),
      languages: extractLanguages(),
      meta: {
        extractedAt: new Date().toISOString(),
        sourceUrl: window.location.href.split('?')[0],
        version: '2.0'
      }
    };

    console.log('[LinkedIn Sync] Extracted:', {
      experience: profile.experience.length,
      certifications: profile.certifications.length,
      publications: profile.publications.length,
      projects: profile.projects.length,
      skills: profile.skills.length
    });

    return profile;
  }

  // ── Message listener ─────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProfile') {
      extractProfile()
        .then(profile => sendResponse({ success: true, profile }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // keep channel open for async response
    }
  });

})();
