import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
const SITE_NAME = process.env.SITE_NAME || "My Awesome Blog";
const SITE_URL = process.env.SITE_URL || "https://example.com";

if (!OPENROUTER_API_KEY) {
    console.error(chalk.red("Error: OPENROUTER_API_KEY (or AI_API_KEY) is missing in .env"));
    // We don't exit here to allow for dry runs or testing, but it will fail later if called.
}

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
    }
});

const SYSTEM_PROMPT = `
You are an expert SEO Content Writer and Copywriter. 
Your goal is to write high-ranking, engaging, and valuable blog posts.

Rules:
1. **Structure:** Use proper Markdown formatting. H1 for title, H2 for main sections, H3 for subsections.
2. **SEO:** Naturally include the target keyword in the first paragraph, headers, and conclusion. Do not keyword stuff.
3. **Engagement:** Write short, punchy paragraphs (2-3 sentences). Use bullet points and lists to break up text.
4. **Tone:** Professional yet accessible, authoritative but not dry. 
5. **Format:** Return ONLY the Markdown content. Do not wrap it in a code block. 
   - Start with a Frontmatter block in YAML format:
     ---
     title: "The Clickbait Title"
     date: YYYY-MM-DD
     tags: [tag1, tag2, tag3]
     excerpt: "A short summary for SEO."
     ---
`;

export async function generateContent(topic, options) {
    console.log(chalk.blue(`\n⚡ connecting to AI matrix for topic: "${topic}"...`));

    const model = options.model || "google/gemini-2.0-flash-001"; // Fast, cheap, good
    const tone = options.tone || "informative";
    const length = options.length || "800";

    const userPrompt = `
    Write a comprehensive blog post about: "${topic}".
    
    Target Audience: Beginners to Intermediates.
    Tone: ${tone}.
    Approximate Length: ${length} words.
    
    Make sure to cover:
    - What is ${topic}?
    - Why does it matter?
    - Top 3 tips or tools related to it.
    - A conclusion with a call to action.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        
        // Ensure content directory exists
        const contentDir = path.join(process.cwd(), 'content');
        if (!fs.existsSync(contentDir)){
            fs.mkdirSync(contentDir);
        }

        // Generate filename from topic
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${new Date().toISOString().split('T')[0]}-${slug}.md`;
        const filepath = path.join(contentDir, filename);

        // Write to file
        fs.writeFileSync(filepath, content);
        
        return { path: filepath, content: content };

    } catch (error) {
        throw new Error(`AI Generation failed: ${error.message}`);
    }
}
