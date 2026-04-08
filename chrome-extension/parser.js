// parser.js — uses Claude AI to clean and structure extracted LinkedIn data

const Parser = {

  async structureProfile(rawProfile, anthropicKey) {
    const prompt = `You are a LinkedIn profile parser. You will receive raw extracted DOM data from a LinkedIn profile page and must convert it into a clean, structured JSON object.

Here is the raw extracted data:
<raw_profile>
${JSON.stringify(rawProfile, null, 2)}
</raw_profile>

Return ONLY a valid JSON object with this exact structure (no explanation, no markdown fences):
{
  "basics": {
    "name": "",
    "title": "",
    "company": "",
    "location": "",
    "bio": "",
    "linkedinUrl": "",
    "githubUrl": "",
    "email": ""
  },
  "publications": [
    {
      "title": "",
      "journal": "",
      "year": "",
      "authors": "",
      "url": "",
      "contribution": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "status": "active | in-progress | expired"
    }
  ],
  "projects": [
    {
      "name": "",
      "tech": "",
      "description": "",
      "url": "",
      "visibility": "public | private"
    }
  ],
  "experience": [
    {
      "title": "",
      "company": "",
      "duration": "",
      "location": "",
      "description": "",
      "tech": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "school": "",
      "years": ""
    }
  ],
  "skills": [],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "meta": {
    "extractedAt": "",
    "sourceUrl": "",
    "version": "1.0"
  }
}

Rules:
- Clean up any garbled or duplicate text from DOM extraction
- Infer company from experience[0] if not in basics
- Keep skills as a flat array of strings
- Set meta.extractedAt to current ISO timestamp
- If a field has no data, use empty string or empty array
- Return ONLY the JSON object, nothing else`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Claude API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.content.map(b => b.text || '').join('').trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  },

  // Fallback: use raw profile directly without AI structuring
  structureProfileFallback(rawProfile) {
    return {
      basics: {
        name: rawProfile.basics?.name || '',
        title: rawProfile.basics?.title || '',
        company: rawProfile.experience?.[0]?.company || '',
        location: rawProfile.basics?.location || '',
        bio: rawProfile.basics?.bio || '',
        linkedinUrl: rawProfile.basics?.linkedinUrl || '',
        githubUrl: '',
        email: ''
      },
      publications: rawProfile.publications || [],
      certifications: rawProfile.certifications || [],
      projects: rawProfile.projects || [],
      experience: rawProfile.experience || [],
      education: rawProfile.education || [],
      skills: rawProfile.skills || [],
      languages: rawProfile.languages || [],
      meta: {
        extractedAt: new Date().toISOString(),
        sourceUrl: rawProfile.sourceUrl || '',
        version: '1.0'
      }
    };
  }
};
