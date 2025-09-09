#!/bin/bash
# setup-dev.sh — ThemeSmith universal dev setup script

set -e

echo ""
echo "🛠  Setting up ThemeSmith development environment..."
echo ""

echo "OPENAI_API_KEY=sk-xxxxx" > .env


# 1. Ensure Node.js is installed
if ! command -v node &> /dev/null
then
  echo "❌ Node.js is not installed. Please install Node.js 18+ before continuing."
  exit 1
fi

# 2. Ensure npm is installed
if ! command -v npm &> /dev/null
then
  echo "❌ npm is not installed. Please install Node.js which includes npm."
  exit 1
fi

# 3. Check for OpenAI API key
if [[ -z "${OPENAI_API_KEY}" ]]; then
  echo "❌ OPENAI_API_KEY is not set in your environment."
  echo "👉 Please run: export OPENAI_API_KEY=sk-xxx before running this script."
  exit 1
fi

# 4. Install root dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# 5. Install Ghost theme validator
echo "🔍 Installing Ghost theme validator (gscan)..."
npm install -g gscan

# 6. Create output folder if missing
mkdir -p output

# 7. Confirm gpt prompts exist
if [ ! -f "./gpt/user_agent_prompt.txt" ]; then
  echo "❌ Missing: ./gpt/user_agent_prompt.txt"
  exit 1
fi
if [ ! -f "./gpt/code_agent_prompt.txt" ]; then
  echo "❌ Missing: ./gpt/code_agent_prompt.txt"
  exit 1
fi

# 8. Optional: Setup .env if it doesn't exist



if [ ! -f ".env" ]; then
  echo "OPENAI_API_KEY=$OPENAI_API_KEY" > .env
  echo "🧪 .env file created with your OpenAI key"
fi

# 9. Final Message
echo ""
echo "✅ ThemeSmith dev environment is ready!"
echo "📂 Run user agent: node run-agent.js user"
echo "🧠 Run code agent: node run-agent.js code"
echo ""

