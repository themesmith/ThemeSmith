// run-agent.js
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const agent = process.argv[2]; // "user" or "code"
const promptFile = agent === 'code' ? 'code_agent_prompt.txt' : 'user_agent_prompt.txt';

const promptPath = path.join('gpt', promptFile);
const specPath = path.join('themeSpec.json');

const runAgent = async () => {
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Missing prompt file: ${promptPath}`);
  }
  if (!fs.existsSync(specPath)) {
    throw new Error(`Missing theme spec: ${specPath}`);
  }
  const prompt = fs.readFileSync(promptPath, 'utf-8');
  const spec = fs.readFileSync(specPath, 'utf-8');

  const fullPrompt = `
${prompt}

Here is the current themeSpec.json:
\`\`\`json
${spec}
\`\`\`

Now execute your task.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: `You are a file-based Codex agent.` },
      { role: 'user', content: fullPrompt }
    ],
    temperature: 0.2,
    max_tokens: 4000,
  });

  console.log('\n🧠 Response:\n', response.choices[0].message.content);
};

runAgent();
