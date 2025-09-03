// AI recommendation prompt templates
module.exports = {
  PROMPT_SIMILAR: `Suggest 5 books that are similar to the user's favourite books ({{favourites}}) or genres ({{genres}}). Reply as a JSON array of book titles. If not enough data, suggest top-rated books in general.`,
  PROMPT_TOP_RATED: `Suggest 5 top-rated books for a new user. Reply as a JSON array of book titles.`
};
