const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const quotesFile = path.join(__dirname, "../data/daily-quotes.json");
const QUOTES_PER_BATCH = Number(process.env.DAILY_QUOTES_PER_BATCH || 5);

// Ensure data directory exists
const dataDir = path.dirname(quotesFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Fetch motivational quote from OpenRouter API
const fetchMotivationalQuotes = async () => {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const prompt = `Generate ${QUOTES_PER_BATCH} short, inspiring motivational quotes for productivity. 
Return ONLY a valid JSON array of objects, where each object has exactly these keys: "text" (the quote) and "author" (the author name). 
Do NOT wrap the json in backticks, code blocks, or markdown.`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content.trim();
    // Clean up potential markdown formatting from the model
    responseText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(responseText);
    const quotes = data.map((q) => ({
      text: q.text,
      author: q.author || "Unknown",
    }));

    return {
      fetchedAt: new Date().toISOString(),
      source: "api",
      quotes: quotes.length
        ? quotes
        : [
            {
              text: "Every day is a new opportunity to grow.",
              author: "Unknown",
            },
          ],
    };
  } catch (error) {
    console.error("Error fetching quotes from OpenRouter:", error.message);
    // Fallback static quotes
    return {
      fetchedAt: new Date().toISOString(),
      source: "fallback",
      quotes: [
        { text: "Every day is a new opportunity to grow.", author: "Unknown" },
        {
          text: "Focus on being productive instead of busy.",
          author: "Tim Ferriss",
        },
        {
          text: "Action is the foundational key to all success.",
          author: "Pablo Picasso",
        },
        {
          text: "Don't watch the clock; do what it does. Keep going.",
          author: "Sam Levenson",
        },
        {
          text: "The secret of getting ahead is getting started.",
          author: "Mark Twain",
        },
      ],
    };
  }
};

// Check if we need to refresh the quote (once per day)
const shouldRefreshQuotes = () => {
  if (!fs.existsSync(quotesFile)) return true;

  try {
    const data = JSON.parse(fs.readFileSync(quotesFile, "utf8"));
    if (data.source !== "api") {
      return true;
    }

    const fetchedDate = new Date(data.fetchedAt);
    const now = new Date();

    // If more than 24 hours have passed, refresh
    return (now - fetchedDate) / (1000 * 60 * 60) > 24;
  } catch (e) {
    return true;
  }
};

const getRandomQuote = async () => {
  let quotesData;
  try {
    if (!shouldRefreshQuotes() && fs.existsSync(quotesFile)) {
      quotesData = JSON.parse(fs.readFileSync(quotesFile, "utf8"));
    } else {
      quotesData = await fetchMotivationalQuotes();
      if (quotesData.source === "api") {
        fs.writeFileSync(
          quotesFile,
          JSON.stringify(quotesData, null, 2),
          "utf8",
        );
      }
    }
  } catch (err) {
    console.error("Error in cached quotes:", err);
    quotesData = {
      source: "fallback",
      quotes: [
        { text: "Every day is a new opportunity to grow.", author: "Unknown" },
      ],
    };
  }

  // Return a random quote from the cached array
  const randomItem =
    quotesData.quotes[Math.floor(Math.random() * quotesData.quotes.length)];
  return {
    text: randomItem.text,
    author: randomItem.author,
    fetchedAt: quotesData.fetchedAt,
  };
};

module.exports = { getRandomQuote };
