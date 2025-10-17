# Quick Start Guide - Enhanced RAG System

## ✅ System is Ready!

Your AI Intel Pipeline now has **generative intelligence** capabilities. Here's how to use it:

---

## Step 1: Initial Setup (One Time)

Check that you have API keys configured:

```bash
# Should have ANTHROPIC_API_KEY or OPENAI_API_KEY in environment
# Check .env file or set them:
export ANTHROPIC_API_KEY="your-key"
# or
export OPENAI_API_KEY="your-key"
```

---

## Step 2: Build Your Knowledge Base

### If you have existing data in vault:

```bash
cd /c/Users/User/ai-intel-pipeline
python -m ai_intel_pipeline build-knowledge
```

This will:
1. Export all items to JSONL
2. Build embeddings index
3. Extract patterns from items
4. Synthesize meta-insights

**Time:** ~5-10 minutes for 50 items
**Cost:** ~$5-10 (one-time)

### If starting fresh:

```bash
# Ingest some content first
python -m ai_intel_pipeline ingest --limit 10

# Then build knowledge
python -m ai_intel_pipeline build-knowledge
```

---

## Step 3: Ask Your AI Assistant!

Now you can have conversations with your AI that knows about practical AI innovations:

```bash
python -m ai_intel_pipeline ask "How can I build an AI chatbot with streaming responses?"
```

**What happens:**
1. System retrieves relevant items + patterns + meta-insights
2. LLM synthesizes them into a novel solution
3. Provides: solution, reasoning, techniques, stack, implementation steps
4. Generates creative insights by combining multiple sources

**Output location:** `vault/ai-intel/solutions/solution_<timestamp>.md`

---

## Daily Workflow

### Morning: Ingest New Content
```bash
python -m ai_intel_pipeline ingest --limit 10
```

Finds new practical AI innovations from:
- YouTube (demos, tutorials, "I built X")
- GitHub (trending repos, releases)

### During Day: Ask Questions as Needed
```bash
python -m ai_intel_pipeline ask "Your question here"
```

Examples:
- "How do I implement AI code review in my workflow?"
- "Best practices for Next.js + Claude integration?"
- "Novel ways people are automating with AI?"

### Weekly: Update Knowledge Base
```bash
python -m ai_intel_pipeline build-knowledge
python -m ai_intel_pipeline digest --week current
```

---

## Understanding What You Built

### Traditional System (Before):
```
Ingest → Store → Search → Show Results
```
You read everything and connect dots yourself.

### Your New System (After):
```
Ingest → Extract Patterns → Find Connections → Generate Novel Solutions
```
AI does the learning and connecting for you.

---

##Key Files

### Knowledge Storage:
- `vault/ai-intel/items/` - Original items
- `vault/ai-intel/patterns/` - Extracted patterns
- `vault/ai-intel/meta_insights.json` - Cross-item insights
- `vault/ai-intel/solutions/` - Generated solutions

### Embeddings:
- `vault/model/embeddings.npz` - Vector representations
- `vault/model/metadata.json` - Item metadata

---

## Example Conversation

```bash
$ python -m ai_intel_pipeline ask "How can I automate my email workflow with AI?"

Generating solution...

## Solution
Based on 5 successful implementations in the vault, create a hybrid automation
system using no-code orchestration (n8n) combined with Claude for intelligent
decision-making...

## Why This Works
This approach has been validated across multiple real-world implementations...

## Techniques to Use
- Webhook-triggered workflows
- Claude for smart email classification
- Incremental automation (start small)

## Recommended Stack
- n8n (orchestration)
- Claude API (intelligence)
- Gmail API
- Supabase (logs)

## Implementation Steps
1. Map your current manual email workflow
2. Identify decision points → Convert to Claude prompts
3. Build n8n flow for mechanical parts (move, label, archive)
4. Test with 10 emails before full deployment
5. Monitor and refine Claude prompts based on accuracy

## Novel Insights
💡 Use Claude to GENERATE the n8n workflow definition from natural language
💡 Combine email patterns with calendar context for smarter prioritization
💡 Create feedback loop: Claude learns from your accept/reject decisions

## Related Examples
- [AI Email Assistant with n8n](https://youtube.com/...)
- [Smart Workflow Automation](https://github.com/...)

Solution saved to vault/ai-intel/solutions/solution_20251017-163045.md
```

---

## Cost Monitoring

Track your API costs:

- **Daily ingestion** (~10 items): ~$0.30/day = $9/month
- **Weekly knowledge build**: ~$2/week = $8/month
- **Assistant queries** (20/month): ~$20/month

**Total: ~$35-40/month**

Much cheaper than YouTube Premium + your time reading everything! 😄

---

## Troubleshooting

### "LLM not available"
- Check API keys are set: `echo $ANTHROPIC_API_KEY`
- Or edit `.env` file in project root

### "No patterns found"
- Run `build-knowledge` first
- Need at least 3 items in vault

### "Solution is generic"
- Add more items to vault (more patterns = better synthesis)
- Update your profile in `profile/profile.json` with specific goals

---

## Next Steps

1. ✅ **Test the assistant:** Ask it a question!
2. ✅ **Set up daily ingestion:** Add to cron or run manually each morning
3. ✅ **Explore patterns:** Check `vault/ai-intel/patterns/` to see extracted knowledge
4. ✅ **Read meta-insights:** Open `vault/ai-intel/meta_insights.json`
5. ✅ **View solutions:** Browse `vault/ai-intel/solutions/` for past Q&A

---

## The Big Picture

You now have an **AI research assistant** that:
- ✅ Continuously monitors practical AI innovations
- ✅ Learns patterns from what actually works
- ✅ Connects ideas across multiple sources
- ✅ Generates creative, novel solutions to YOUR problems
- ✅ Gets smarter as more content is ingested

**This isn't just a filing cabinet. It's a learning system.**

Ready to try it? Run:
```bash
python -m ai_intel_pipeline ask "What should I build next with AI?"
```
