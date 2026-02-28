import { generateContent } from './src/generator.js';
import { scoutTargets } from './src/scout.js';
import { submitContent } from './src/submitter.js';
import chalk from 'chalk';
import fs from 'fs';

const TOPICS_FILE = 'topics.txt';
const INTERVAL_HOURS = 6;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCycle() {
    console.log(chalk.magenta.bold('\n👻 TRAFFIC PHANTOM: Starting Autonomous Cycle 👻'));

    // 1. Pick Topic
    if (!fs.existsSync(TOPICS_FILE)) {
        console.error(chalk.red('Error: topics.txt missing.'));
        process.exit(1);
    }
    const topics = fs.readFileSync(TOPICS_FILE, 'utf-8').split('\n').filter(t => t.trim());
    const topic = topics[Math.floor(Math.random() * topics.length)].trim();
    
    console.log(chalk.white(`Target Topic: `) + chalk.cyan.bold(topic));

    try {
        // 2. Scout
        console.log(chalk.yellow('\n[1/3] Scouting Targets...'));
        const targets = await scoutTargets(topic, { count: 20 });
        if (targets.length === 0) {
            console.log(chalk.red('No targets found. Aborting cycle.'));
            return;
        }

        // 3. Generate Content
        console.log(chalk.yellow('\n[2/3] Generating Content...'));
        const { path: contentPath } = await generateContent(topic, { length: 600, tone: 'helpful' });

        // 4. Spread
        console.log(chalk.yellow('\n[3/3] Spreading Links...'));
        await submitContent('targets.json', { content: contentPath });

        console.log(chalk.green.bold('\n✨ Cycle Complete. Traffic incoming. ✨'));

    } catch (error) {
        console.error(chalk.red(`Cycle failed: ${error.message}`));
    }
}

async function main() {
    while (true) {
        await runCycle();
        
        // Random sleep 4-8 hours
        const sleepHours = INTERVAL_HOURS + (Math.random() * 4);
        console.log(chalk.gray(`\nSleeping for ${sleepHours.toFixed(1)} hours...`));
        await sleep(sleepHours * 60 * 60 * 1000);
    }
}

main();
