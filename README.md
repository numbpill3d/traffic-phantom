# Traffic Phantom 👻

**Automated Traffic Generation & SEO CLI**

Traffic Phantom is a modular CLI tool designed to automate the process of content generation, target scouting, and link submission. It is the modern, AI-powered spiritual successor to legacy tools like Money Robot.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/numbpill3d/traffic-phantom.git
cd traffic-phantom
npm install
```

### 2. Configure

There are **two ways** to configure Traffic Phantom depending on how you want to run it.

---

#### Option A: Run via GitHub Actions (Recommended)

This is the hands-off approach. The workflow runs every 6 hours automatically, or you can trigger it manually with custom values.

**Step 1 -- Set your API key as a repository secret:**

Go to your repo's **Settings > Secrets and variables > Actions > New repository secret** and add:

| Secret Name          | Value                              |
|----------------------|------------------------------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key            |

> Get a key at [openrouter.ai/keys](https://openrouter.ai/keys)

**Step 2 -- (Optional) Set default values for scheduled runs:**

If you want the automatic (cron) runs to use your custom identity instead of the built-in defaults, add these as repository secrets too:

| Secret Name       | What it does                                      | Default if not set     |
|-------------------|---------------------------------------------------|------------------------|
| `SITE_NAME`       | Your site/brand name (OpenRouter X-Title header)  | `My Awesome Blog`     |
| `SITE_URL`        | Your site URL (Referer header + comment URL field) | `https://example.com` |
| `COMMENT_AUTHOR`  | Name posted in comment forms                      | `Fan`                 |
| `COMMENT_EMAIL`   | Email used in comment forms                       | `fan@example.com`     |

**Step 3 -- Trigger a manual run (with custom values):**

1. Go to **Actions > Traffic Phantom Autonomous Run**
2. Click **Run workflow**
3. Fill in the input fields (site name, URL, author, email)
4. Click the green **Run workflow** button

The workflow_dispatch inputs let you override values per-run without touching secrets.

---

#### Option B: Run Locally

**Step 1 -- Create your `.env` file:**

```bash
cp .env.example .env
```

**Step 2 -- Edit `.env` with your values:**

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SITE_NAME=My Awesome Blog
SITE_URL=https://myblog.com
COMMENT_AUTHOR=YourName
COMMENT_EMAIL=you@example.com
```

**Step 3 -- Run a cycle:**

```bash
node run-one-cycle.js
```

Or use the CLI commands individually:

```bash
# Generate content
node index.js generate "best free ai tools"

# Find targets
node index.js scout "tech blog guest post"

# Submit content to targets
node index.js spread targets.json --content content/article.md
```

---

## Configuration Reference

| Variable             | Used In                  | Purpose                                                    |
|----------------------|--------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY` | `src/generator.js`       | Authenticates with OpenRouter to generate AI content       |
| `SITE_NAME`          | `src/generator.js`       | Sent as `X-Title` header to OpenRouter                     |
| `SITE_URL`           | `src/generator.js`, `src/submitter.js` | Sent as `HTTP-Referer` to OpenRouter; posted in comment URL fields |
| `COMMENT_AUTHOR`     | `src/submitter.js`       | Name filled into comment author fields on target sites     |
| `COMMENT_EMAIL`      | `src/submitter.js`       | Email filled into comment email fields on target sites     |

---

## Modules

### 1. Generate (`generate`)
Uses LLMs via OpenRouter (Gemini, GPT-4, Claude) to create high-quality, SEO-optimized articles based on your keywords.

### 2. Scout (`scout`)
Scans the web using search dorks to find relevant blogs, forums, and guestbooks for your niche.

### 3. Spread (`spread`)
The submission engine. Uses headless browsers (Puppeteer + Stealth) to automate posting content to the targets found by Scout. Includes basic OCR captcha solving via Tesseract.

---

## Topics

Edit `topics.txt` to customize the keywords/topics the phantom cycles through. One topic per line.

---

## File Structure

```
traffic-phantom/
├── .env.example          # Template for local environment config
├── .github/workflows/
│   └── phantom-run.yml   # GitHub Actions workflow (cron + manual dispatch)
├── index.js              # CLI entry point
├── run-one-cycle.js      # Single autonomous cycle (used by Actions)
├── scheduler.js          # Local long-running scheduler
├── topics.txt            # Topic list for random selection
├── src/
│   ├── generator.js      # AI content generation via OpenRouter
│   ├── scout.js          # Target discovery via search dorks
│   ├── solver.js         # OCR captcha solver (Tesseract)
│   └── submitter.js      # Stealth comment submission engine
└── package.json
```

---

## Disclaimer

This tool is for educational and research purposes only. Use responsibly.
