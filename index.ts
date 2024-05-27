import express from "express";
import { type MatchType } from "./db/schema";
import cheerio from "cheerio";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { saveToDb } from "./lib/utils";

const app = express();

app.use(express.json());

puppeteer.use(StealthPlugin());

app.get("/live/tipsport", async (req, res) => {
  try {
    const matches = [] as MatchType[];

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.tipsport.sk/live", {
      waitUntil: "networkidle2",
    });
    const tabs = await page.$$(
      ".LiveOverviewSportTabstyled__SportTab-sc-805zbr-0",
    );

    async function scrapeData() {
      const content = await page.content(); // get the HTML content

      const $ = cheerio.load(content);

      // Select all match rows
      $(".LiveOverviewMatchstyled__MatchRow-sc-oy8wyv-1").each((_, element) => {
        const match = {} as MatchType;

        match.bookmaker = "tipsport";

        const teamsText = $(element)
          .find(".LiveOverviewMatchstyled__MatchName-sc-oy8wyv-4 span")
          .text();
        const [team1, team2] = teamsText.split(" - ");
        match.team1 = team1?.toLowerCase().trim();
        match.team2 = team2?.toLowerCase().trim();
        if (!match.team1 || !match.team2) return;

        const odds = [] as string[];
        $(element)
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
        match.odds1 = Number(odds[0]) || null;
        match.oddsTie = Number(odds[1]) || null;
        match.odds2 = Number(odds[2]) || null;

        if (match.oddsTie || match.odds1 || match.odds1) matches.push(match);
      });
    }

    for (const tab of tabs) {
      await tab.click();
      await new Promise((resolve) => setTimeout(resolve, 500)); // NOTE: tweak this to find the fastest time
      await scrapeData();
    }
    await browser.close();

    res.status(200).json({ message: "Scraped successfully", data: matches });

    await saveToDb(matches);
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      res.status(500).json({ error });
    } else {
      res.status(500).json({ error: "An error occurred" });
    }
  }
});

const port = 6969;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
