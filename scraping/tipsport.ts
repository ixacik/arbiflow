import puppeteer from "puppeteer";
import type { Match } from "../types";
import cheerio from "cheerio";
import { getEmbedding } from "../lib/vector";

export default async function scrapeTipsport(matches: Match[]) {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.tipsport.sk/live", {
      waitUntil: "networkidle2",
    });
    const tabs = await page.$$(
      ".LiveOverviewSportTabstyled__SportTab-sc-805zbr-0",
    );

    const uniqueTeamNames = new Set<string>();
    const matchesWithoutEmbeddings: Omit<Match, "embedding1" | "embedding2">[] =
      [];

    async function scrapeData() {
      const content = await page.content(); // get the HTML content

      const $ = cheerio.load(content);

      const rows = $(
        ".LiveOverviewMatchstyled__MatchRow-sc-oy8wyv-1",
      ).toArray();

      // Select all match rows
      for (const row of rows) {
        const bookmaker = "tipsport";

        const teamsText = $(row)
          .find(".LiveOverviewMatchstyled__MatchName-sc-oy8wyv-4 span")
          .text();
        const [team1, team2] = teamsText.split(" - ");
        if (!team1 || !team2) return;

        const odds = [] as string[];
        $(row)
          .find(
            ".LiveOverviewMatchCellsstyled__InsidePaddRow-sc-zro7iv-0.grUyBm",
          )
          .each((_, oddCell) => {
            $(oddCell)
              .children(".BetButtonstyled__BetButton-sc-1tviux5-0")
              .find("span:nth-child(2)")
              .each((_, odd) => {
                const text = $(odd).text();
                if (!text) odds.push("null");
                else odds.push(text);
              });
          });

        uniqueTeamNames.add(team1);
        uniqueTeamNames.add(team2);

        const matchWithoutEmbeddings: Omit<Match, "embedding1" | "embedding2"> =
        {
          bookmaker,
          team1,
          team2,
          odds1: Number(odds[0]) || null,
          oddsTie: Number(odds[1]) || null,
          odds2: Number(odds[2]) || null,
        };

        if (
          matchWithoutEmbeddings.oddsTie ||
          matchWithoutEmbeddings.odds1 ||
          matchWithoutEmbeddings.odds1
        )
          matchesWithoutEmbeddings.push(matchWithoutEmbeddings);
      }
    }

    for (const tab of tabs) {
      await tab.click();
      await new Promise((resolve) => setTimeout(resolve, 500)); // NOTE: tweak this to find the fastest time
      await scrapeData();
    }
    await browser.close();

    const embeddings = await Promise.all(
      Array.from(uniqueTeamNames).map((name) => getEmbedding(name)),
    );
    const embeddingsMap = new Map(embeddings.map((e) => [e.name, e.embedding]));

    for (const match of matchesWithoutEmbeddings) {
      const embedding1 = embeddingsMap.get(match.team1);
      const embedding2 = embeddingsMap.get(match.team2);
      if (!embedding1 || !embedding2)
        throw new Error("Mismatched between prepared embeddings and matches");
      matches.push({
        ...match,
        embedding1: embedding1,
        embedding2: embedding2,
      });
    }

    return { error: "" };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    } else {
      return { error: "An error occurred" };
    }
  }
}
