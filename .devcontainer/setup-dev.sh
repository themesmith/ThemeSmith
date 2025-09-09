#!/bin/bash
# setup-dev.sh — ThemeSmith dev environment setup (agent checks disabled)

set -e

echo ""
echo "🛠  Setting up ThemeSmith development environment..."
echo ""

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

# 3. Load .env if it exists (optional)
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 4. Fallback for OPENAI_API_KEY if not set
: "${OPENAI_API_KEY:=sk-fake-key-for-dev}"
export OPENAI_API_KEY

# 5. Notify user about key usage
if [[ "$OPENAI_API_KEY" == "sk-fake-key-for-dev" ]]; then
  echo "⚠️  OPENAI_API_KEY not provided. Using fake key for non-API testing only."
else
  echo "🔐 OPENAI_API_KEY is set and ready."
fi

# 6. Install project dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# 7. Install Ghost validator (gscan)
if ! command -v gscan &> /dev/null; then
  echo "🔍 Installing Ghost theme validator..."
  npm install -g gscan
else
  echo "✅ gscan already installed"
fi

# 8. [DISABLED] Agent prompt file validation
# echo "🔕 Skipping agent prompt checks for now..."
# MISSING_PROMPTS=0
# for file in "./gpt/user_agent_prompt.txt" "./gpt/code_agent_prompt.txt"; do
#   if [ ! -f "$file" ]; then
#     echo "❌ Missing prompt file: $file"
#     MISSING_PROMPTS=1
#   fi
# done
# if [ "$MISSING_PROMPTS" -eq 1 ]; then
#   echo "🚨 Setup incomplete due to missing prompt files."
#   exit 1
# fi

# 9. Create output folder if it doesn't exist
mkdir -p output

echo ""
echo "✅ ThemeSmith Dev Container is ready (agents temporarily disabled)."
echo ""
