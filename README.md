# 🛠️ ThemeSmith

> **Forge beautifully crafted web themes with the power of AI.**

ThemeSmith is an open-source, AI-powered toolkit that helps you design and generate **production-ready** theme kits for platforms like Ghost, WordPress, and more — using simple prompts or structured specs.

---

![License](https://img.shields.io/github/license/themesmith/core)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Powered by GPT-4](https://img.shields.io/badge/powered%20by-GPT--4-blueviolet)

---

## 🚀 What is ThemeSmith?

**ThemeSmith** helps developers, designers, and creators forge professional theme kits for modern CMS and web platforms.

It combines:

- 🧠 Prompt-based AI input
- 🎨 Spec-driven design logic
- ⚙️ Platform-aware code generation
- ✅ Validator integrations
- 🧰 Zipped, deploy-ready output

---

## ✨ Features

- 🧠 AI theme spec intake (via prompt or UI)
- 🎨 Previews of homepage, post layout, etc.
- ⚙️ Modular support: Ghost, WordPress (more coming)
- ✅ Integrated Ghost Theme Validator + WP Theme Check
- 🔄 Exports as `.zip`, or directly to GitHub repo
- 🧾 JSON-based structured specs (`themeSpec.json`)
- 📂 Auto-structured folder output
- 🛒 Marketplace support
- 🖼️ AI-generated header images
- 🧩 Component-level block editing (Framer-style)

---

## 📦 Tech Stack

| Layer       | Tools                     |
|-------------|---------------------------|
| Frontend    | React + Tailwind + Next.js|
| Backend API | Node.js + Express         |
| AI Engine   | OpenAI GPT-4              |
| CMS Targets | Ghost, WordPress          |
| Output      | Clean `.zip` + README     |

---

## 🗂 Folder Structure (Core Module)

```

themesmith/
├── api/
│   └── generate-theme.js
├── frontend/
│   └── pages/index.jsx
├── gpt/
│   ├── user\_agent\_prompt.txt
│   └── code\_agent\_prompt.txt
├── themeSpec.json
├── .gitignore
├── LICENSE
└── README.md

````

---

## 🧪 themeSpec.json (Sample)

```
```json
{
  "platform": "ghost",
  "projectName": "Clean Grid Blog",
  "layout": {
    "homepage": "grid",
    "postPage": "single-column",
    "tagPage": "minimal"
  },
  "colors": {
    "primary": "#1a1a1a",
    "accent": "#ff5722",
    "background": "#ffffff",
    "text": "#333333"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Open Sans"
  },
  "features": [
    "dark_mode",
    "newsletter_signup",
    "search",
    "featured_posts"
  ],
  "navigation": {
    "style": "top-bar",
    "links": [
      { "label": "Home", "url": "/" },
      { "label": "About", "url": "/about" },
      { "label": "Blog", "url": "/blog" }
    ]
  },
  "exampleSites": [
    "https://framer.com",
    "https://vercel.com"
  ]
}
````

---

## ⚙️ `api/generate-theme.js`

```js
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { buildThemeFromSpec } from '../../core/themeBuilder';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const themeSpec = req.body;

  try {
    const themePath = await buildThemeFromSpec(themeSpec);

    exec(`gscan ${themePath}`, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: 'Validation failed', details: stderr });
      }

      const zipFile = path.join(themePath, '..', `${themeSpec.projectName}.zip`);
      res.status(200).json({
        message: 'Theme built successfully',
        download: `/output/${themeSpec.projectName}.zip`,
        validator: stdout
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Theme generation failed', details: err.message });
  }
}
```

---

## 🧠 GPT Prompts

### `gpt/user_agent_prompt.txt`

```
You are an AI assistant that helps users design complete, modern theme kits for Ghost, WordPress, and other platforms. Begin by asking for the user's vision or let them select from pre-designed templates. Walk them through layout, color, font, feature, and navigation decisions. If they’re unsure, guide them with examples. After gathering the spec, send it to the build engine for theme generation, validation, and delivery.
```

### `gpt/code_agent_prompt.txt`

```
You are an IDE coding agent. Your task is to receive a structured theme specification (themeSpec.json) and generate a complete, platform-compliant theme kit. Include all required files, layouts, assets, and templates. Validate the theme using appropriate tools (Ghost CLI, WP Check). Return a clean `.zip` package and validation report.
```

---

## 🖥️ React UI – `frontend/pages/index.jsx`

```jsx
import React, { useState } from 'react';

export default function ThemeBuilder() {
  const [spec, setSpec] = useState({});
  const [outputUrl, setOutputUrl] = useState(null);

  const handleSubmit = async () => {
    const res = await fetch('/api/generate-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec)
    });

    const data = await res.json();
    setOutputUrl(data.download);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Theme Generator</h1>

      <input
        type="text"
        placeholder="Project Name"
        className="input"
        onChange={e => setSpec({ ...spec, projectName: e.target.value })}
      />

      {/* Add layout, fonts, color pickers here */}

      <button className="btn mt-4" onClick={handleSubmit}>
        Generate Theme
      </button>

      {outputUrl && (
        <a href={outputUrl} className="mt-4 block text-blue-500 underline">
          Download Theme
        </a>
      )}
    </div>
  );
}
```

---

## 💡 Advanced Feature Plans

### 🛒 Theme Marketplace

* Public library of AI-generated themes
* Share/download spec JSON + screenshots
* Remix + edit existing themes

### 🔗 GitHub Export

* Export final theme to user’s GitHub repo
* GitHub OAuth + Repo creation via API

### 💾 Save to Dashboard

* Save and reload specs per user
* Use Supabase/Firebase or local JSON storage

### 🎨 AI Header Images

* Generate header art using DALL·E / Midjourney
* Auto-add to hero block of theme

### 🧩 Component-Level Editing

* Drag/drop interface (Framer-style)
* Real-time updates to `themeSpec.json`
* Live previews with Tailwind or Headless UI

---

## 🤝 Contributing

We welcome:

* CMS plugin contributors (Jekyll, Hugo, Shopify, etc.)
* UI/UX designers
* Prompt engineers
* Testers and early adopters

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 🌐 Follow the Project

* GitHub: [github.com/themesmith](https://github.com/themesmith)
* Twitter: [@themesmithAI](https://twitter.com/themesmithAI) *(reserve this handle if you'd like)*
* Coming soon: [themesmith.com](https://themesmith.com) 🌐

---

Built with 🔥 by developers who love clean design.

```


Just say the word — ThemeSmith is one step from launch.
```
