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
    gov: (kw) => `site:.gov "${kw}" "leave a comment"`,
};

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0"
];

const getRandomAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// DuckDuckGo Scraper (HTML)
async function searchDDG(query, limit = 50) {
    console.log(chalk.gray(`  -> Searching DuckDuckGo...`));
    const results = [];
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomAgent() } });
        const $ = cheerio.load(data);

        $('.result__a').each((i, el) => {
            const link = $(el).attr('href');
            if (link && !link.includes('duckduckgo.com') && !results.find(r => r.url === link)) {
                results.push({ url: link, source: 'ddg' });
            }
        });
    } catch (error) {
        console.error(chalk.yellow(`  -> DDG Error: ${error.message}`));
    }
    return results;
}

// Google Scraper (simulated via Startpage/other or direct if possible, kept simple for now to avoid rapid bans)
// For a production tool, you'd integrate SerpApi or a heavy proxy rotator here.
// We'll stick to DDG + Bing (lighter) for this MVP to keep it free.

// Filter dead links
async function filterLiveTargets(targets) {
    console.log(chalk.gray(`\n  -> Verifying ${targets.length} candidates (checking HTTP 200)...`));
    const live = [];
    
    // Check in parallel chunks of 5
    const CHUNK_SIZE = 5;
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(async (t) => {
            try {
                const res = await axios.get(t.url, { 
                    timeout: 5000, 
                    headers: { 'User-Agent': getRandomAgent() }
                });
                if (res.status === 200) return t;
            } catch (e) { return null; }
        });
        
        const results = await Promise.all(promises);
        results.forEach(r => { if (r) live.push(r); });
        process.stdout.write(chalk.gray('.'));
    }
    console.log(''); // newline
    return live;
}

export async function scoutTargets(keyword, options) {
    const platform = options.platform || 'wordpress';
    const count = parseInt(options.count) || 20;
    
    console.log(chalk.blue(`\n🔍 Scouting for ${platform} targets using keyword: "${keyword}"`));

    const dork = DORKS[platform] ? DORKS[platform](keyword) : `${keyword} "leave a comment"`;
    console.log(chalk.gray(`Using Dork: ${dork}`));

    // 1. Search
    // We can loop pages here later, but for now we grab the max from one request
    let rawTargets = await searchDDG(dork, count);
    
    console.log(chalk.cyan(`  -> Found ${rawTargets.length} candidates.`));

    // 2. Filter
    const liveTargets = await filterLiveTargets(rawTargets);

    console.log(chalk.green(`  -> ${liveTargets.length} live targets verified.`));

    // Save results
    if (liveTargets.length > 0) {
        fs.writeFileSync('targets.json', JSON.stringify(liveTargets, null, 2));
    }

    return liveTargets;
}
