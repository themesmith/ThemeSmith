#!/bin/bash
# maintenance.sh — Runs after container is resumed from cache

echo "🔄 Running ThemeSmith maintenance script..."

# 1. Reinstall deps if node_modules is missing (cache cleared)
if [ ! -d "node_modules" ]; then
  echo "📦 node_modules not found — reinstalling packages..."
  npm install
else
  echo "✅ node_modules already present"
fi

# 2. Re-validate prompt files
MISSING_PROMPTS=0
for f in "./gpt/user_agent_prompt.txt" "./gpt/code_agent_prompt.txt"; do
  if [ ! -f "$f" ]; then
    echo "❌ Missing prompt file: $f"
    MISSING_PROMPTS=1
  fi
done

if [ "$MISSING_PROMPTS" -eq 1 ]; then
  echo "🚨 One or more prompt files are missing. Please restore them."
else
  echo "✅ All prompt files present."
fi

# 3. Clean up stale output
if [ -d "output" ]; then
  echo "🧹 Cleaning up old generated themes..."
  rm -rf output/*
  echo "✅ Output folder cleaned."
else
  mkdir -p output
  echo "📂 Created output folder."
fi

# 4. Reinstall Ghost validator if missing
if ! command -v gscan &> /dev/null; then
  echo "📥 gscan (Ghost validator) not found — installing globally..."
  npm install -g gscan
else
  echo "✅ gscan is available"
fi

# 5. Check for .env or warn
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found — OpenAI key may be missing"
else
  echo "🔐 .env file detected"
fi

echo "✅ Maintenance complete!"
