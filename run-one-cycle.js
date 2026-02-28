import { generateContent } from './src/generator.js';
import { scoutTargets } from './src/scout.js';
import { submitContent } from './src/submitter.js';
import chalk from 'chalk';
import fs from 'fs';

const TOPICS_FILE = 'topics.txt';

async function runCycle() {
    console.log(chalk.magenta.bold('\n👻 TRAFFIC PHANTOM: Starting Autonomous Cycle (GitHub Action Mode) 👻'));

    if (!fs.existsSync(TOPICS_FILE)) {
        console.error(chalk.red('Error: topics.txt missing.'));
        process.exit(1);
    }
    const topics = fs.readFileSync(TOPICS_FILE, 'utf-8').split('\n').filter(t => t.trim());
    const topic = topics[Math.floor(Math.random() * topics.length)].trim();
    
    console.log(chalk.white(`Target Topic: `) + chalk.cyan.bold(topic));

    try {
        console.log(chalk.yellow('\n[1/3] Scouting Targets...'));
        const targets = await scoutTargets(topic, { count: 20 });
        
        if (targets.length === 0) {
            console.log(chalk.red('No targets found. Cycle ending early.'));
            return;
        }

        console.log(chalk.yellow('\n[2/3] Generating Content...'));
        const { path: contentPath } = await generateContent(topic, { length: 600, tone: 'helpful' });

        console.log(chalk.yellow('\n[3/3] Spreading Links...'));
        await submitContent('targets.json', { content: contentPath });

        console.log(chalk.green.bold('\n✨ Cycle Complete. Traffic incoming. ✨'));

    } catch (error) {
        console.error(chalk.red(`Cycle failed: ${error.message}`));
        process.exit(1); // Fail the job so GitHub alerts us
    }
}

runCycle();
