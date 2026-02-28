import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chalk from 'chalk';
import fs from 'fs';

// Enable Stealth Mode (hides navigator.webdriver, etc.)
puppeteer.use(StealthPlugin());

// Selectors for common comment forms (WordPress, generic HTML)
const FORM_SELECTORS = {
    comment: ['textarea[name="comment"]', 'textarea[id="comment"]', 'textarea[name="message"]', 'textarea[class*="comment"]'],
    author: ['input[name="author"]', 'input[id="author"]', 'input[name="name"]'],
    email: ['input[name="email"]', 'input[id="email"]'],
    url: ['input[name="url"]', 'input[id="url"]', 'input[name="website"]'],
    submit: ['input[name="submit"]', 'input[type="submit"]', 'button[type="submit"]', 'button[class*="submit"]']
};

async function findElement(page, selectors) {
    for (const sel of selectors) {
        try {
            if (await page.$(sel)) return sel;
        } catch (e) { continue; }
    }
    return null;
}

// Simple retry wrapper
async function retry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, 2000)); // wait 2s
        }
    }
}

export async function submitContent(targetListPath, options) {
    if (!fs.existsSync(targetListPath)) {
        throw new Error(`Target list not found at: ${targetListPath}`);
    }

    const targets = JSON.parse(fs.readFileSync(targetListPath, 'utf-8'));
    const contentFile = options.content;
    let commentBody = "Great post! Really helpful.";
    
    if (contentFile && fs.existsSync(contentFile)) {
        const raw = fs.readFileSync(contentFile, 'utf-8');
        commentBody = raw.replace(/^---[\s\S]+?---/, '').trim();
        if (commentBody.length > 800) commentBody = commentBody.slice(0, 800) + "...";
    }

    console.log(chalk.blue(`\n🚀 Launching Stealth Submission Engine...`));
    
    // Launch options for stability
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ] 
    });

    for (const target of targets) {
        const page = await browser.newPage();
        
        // Randomize Viewport to look human
        await page.setViewport({ width: 1366 + Math.floor(Math.random() * 100), height: 768 + Math.floor(Math.random() * 100) });

        try {
            console.log(chalk.gray(`Visiting: ${target.url}`));
            
            // Go to page with retry logic
            await retry(() => page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 }));

            // Human-like delay
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

            const commentSel = await findElement(page, FORM_SELECTORS.comment);
            const submitSel = await findElement(page, FORM_SELECTORS.submit);

            if (commentSel && submitSel) {
                console.log(chalk.green(`  ✓ Form found.`));
                
                await page.type(commentSel, commentBody, { delay: 50 }); // Type like a human (50ms delay)
                
                const authorSel = await findElement(page, FORM_SELECTORS.author);
                if (authorSel) await page.type(authorSel, process.env.COMMENT_AUTHOR || "Fan", { delay: 50 });
                
                const emailSel = await findElement(page, FORM_SELECTORS.email);
                if (emailSel) await page.type(emailSel, process.env.COMMENT_EMAIL || "fan@example.com", { delay: 50 });
                
                const urlSel = await findElement(page, FORM_SELECTORS.url);
                if (urlSel) await page.type(urlSel, process.env.SITE_URL || "http://example.com", { delay: 50 });

                // Click and wait
                await Promise.all([
                    page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {}),
                    page.click(submitSel)
                ]);
                
                console.log(chalk.cyan(`  ✓ Submitted.`));
            } else {
                console.log(chalk.yellow(`  ✗ No compatible form.`));
            }

        } catch (error) {
            console.log(chalk.red(`  ✗ Failed: ${error.message}`));
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(chalk.blue(`\n🏁 Run complete.`));
}
