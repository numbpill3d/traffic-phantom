import axios from 'axios';
import * as cheerio from 'cheerio';
import chalk from 'chalk';
import fs from 'fs';

// Dork Templates
const DORKS = {
    wordpress: (kw) => `"${kw}" "leave a reply" -"comments closed"`,
    guestbook: (kw) => `"${kw}" intitle:"guestbook"`,
    forum: (kw) => `"${kw}" "powered by vbulletin" inurl:register`,
    edu: (kw) => `site:.edu "${kw}" "post a comment"`,
};

// Fake User Agents to avoid simple blocks
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0"
];

const getRandomAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// DuckDuckGo HTML scrape (No API key needed, but rate limited)
// Note: In production, you'd want to use a real SERP API (SerpApi, DataForSEO) or a rotating proxy scraper.
async function searchDDG(query, limit = 10) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': getRandomAgent() }
        });
        
        const $ = cheerio.load(data);
        const results = [];

        $('.result__a').each((i, el) => {
            if (results.length >= limit) return;
            const link = $(el).attr('href');
            if (link && !link.includes('duckduckgo.com')) {
                results.push({ url: link, source: 'ddg' });
            }
        });

        return results;
    } catch (error) {
        console.error(chalk.yellow(`Warning: Search failed for query "${query}": ${error.message}`));
        return [];
    }
}

export async function scoutTargets(keyword, options) {
    const platform = options.platform || 'wordpress';
    const count = parseInt(options.count) || 10;
    
    console.log(chalk.blue(`\n🔍 Scouting for ${platform} targets using keyword: "${keyword}"`));

    let dork = DORKS[platform] ? DORKS[platform](keyword) : `${keyword} "leave a comment"`;
    console.log(chalk.gray(`Using Dork: ${dork}`));

    // Perform search
    const targets = await searchDDG(dork, count);

    // Save results
    if (targets.length > 0) {
        fs.writeFileSync('targets.json', JSON.stringify(targets, null, 2));
    }

    return targets;
}
