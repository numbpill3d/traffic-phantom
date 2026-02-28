import puppeteer from 'puppeteer';
import chalk from 'chalk';
import fs from 'fs';

// Selectors for common comment forms (WordPress, generic HTML)
const FORM_SELECTORS = {
    comment: ['textarea[name="comment"]', 'textarea[id="comment"]', 'textarea[name="message"]'],
    author: ['input[name="author"]', 'input[id="author"]', 'input[name="name"]'],
    email: ['input[name="email"]', 'input[id="email"]'],
    url: ['input[name="url"]', 'input[id="url"]', 'input[name="website"]'],
    submit: ['input[name="submit"]', 'input[type="submit"]', 'button[type="submit"]']
};

async function findElement(page, selectors) {
    for (const sel of selectors) {
        if (await page.$(sel)) return sel;
    }
    return null;
}

export async function submitContent(targetListPath, options) {
    if (!fs.existsSync(targetListPath)) {
        throw new Error(`Target list not found at: ${targetListPath}`);
    }

    const targets = JSON.parse(fs.readFileSync(targetListPath, 'utf-8'));
    const contentFile = options.content;
    let commentBody = "Great post! Really helpful.";
    
    // Load content if provided
    if (contentFile && fs.existsSync(contentFile)) {
        // Strip frontmatter if present
        const raw = fs.readFileSync(contentFile, 'utf-8');
        commentBody = raw.replace(/^---[\s\S]+?---/, '').trim();
        // Truncate if too long for a comment (some forms limit to 1000 chars)
        if (commentBody.length > 1000) commentBody = commentBody.slice(0, 1000) + "...";
    }

    console.log(chalk.blue(`\n🚀 Launching Submission Engine...`));
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    for (const target of targets) {
        const page = await browser.newPage();
        try {
            console.log(chalk.gray(`Visiting: ${target.url}`));
            await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Find form fields
            const commentSel = await findElement(page, FORM_SELECTORS.comment);
            const authorSel = await findElement(page, FORM_SELECTORS.author);
            const emailSel = await findElement(page, FORM_SELECTORS.email);
            const urlSel = await findElement(page, FORM_SELECTORS.url);
            const submitSel = await findElement(page, FORM_SELECTORS.submit);

            if (commentSel && submitSel) {
                console.log(chalk.green(`  ✓ Comment form found!`));
                
                // Fill form
                await page.type(commentSel, commentBody);
                if (authorSel) await page.type(authorSel, process.env.COMMENT_AUTHOR || "Fan");
                if (emailSel) await page.type(emailSel, process.env.COMMENT_EMAIL || "fan@example.com");
                if (urlSel) await page.type(urlSel, process.env.SITE_URL || "http://example.com");

                // Submit
                await Promise.all([
                    page.waitForNavigation({ timeout: 10000 }).catch(() => {}), // Wait for nav or timeout
                    page.click(submitSel)
                ]);
                
                console.log(chalk.cyan(`  ✓ Submitted.`));
            } else {
                console.log(chalk.yellow(`  ✗ No comment form detected.`));
            }

        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(chalk.blue(`\n🏁 Submission cycle complete.`));
}
