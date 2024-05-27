import { connectToDb } from "../db";
import { Match, type MatchType } from "../db/schema";

export async function saveToDb(matches: MatchType[]) {
  try {
    await connectToDb();
    await Promise.all(
      matches.map(async (match) => {
        Match.findOneAndUpdate(
          {
            team1: match.team1,
            team2: match.team2,
            bookmaker: match.bookmaker,
          },
          { odds1: match.odds1, odds2: match.odds2, oddsTie: match.oddsTie },
          { upsert: true },
        );
      }),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}
