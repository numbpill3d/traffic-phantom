# Traffic Phantom 👻

**Automated Traffic Generation & SEO CLI**

Traffic Phantom is a modular CLI tool designed to automate the process of content generation, target scouting, and link submission. It is the modern, AI-powered spiritual successor to legacy tools like Money Robot.

## Modules

### 1. Generate (`generate`)
Uses LLMs (Gemini, GPT-4, Claude) to create high-quality, SEO-optimized articles based on your keywords.
- **Status:** Skeleton ready. Needs API integration.

### 2. Scout (`scout`)
Scans the web using search dorks to find relevant blogs, forums, and guestbooks for your niche.
- **Status:** Skeleton ready. Needs search API / scraping logic.

### 3. Spread (`spread`)
The submission engine. Uses headless browsers (Puppeteer) to automate posting content to the targets found by Scout.
- **Status:** Skeleton ready. Needs Puppeteer automation scripts.

## Installation

```bash
git clone https://github.com/numbpill3d/traffic-phantom.git
cd traffic-phantom
npm install
npm link
```

## Usage

```bash
# Generate content
traffic-phantom generate "best free ai tools"

# Find targets
traffic-phantom scout "tech blog guest post"

# Submit content
traffic-phantom spread targets.json --content content/article.md
```

## Disclaimer
This tool is for educational and research purposes only. Use responsibly.
