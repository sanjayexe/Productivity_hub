const { getRandomQuote } = require("../services/quoteService");

const getQuote = async (req, res) => {
  try {
    const quote = await getRandomQuote();
    res.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ message: "Error fetching quote" });
  }
};

module.exports = { getQuote };
