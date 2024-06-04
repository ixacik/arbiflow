import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import scrapeTipsport from "./scraping/tipsport";
import type { Match } from "./types";

const app = express();

app.use(express.json());

puppeteer.use(StealthPlugin());

// global array to store all maches
const matches: Match[] = [];

app.get("/live/tipsport", async (req, res) => {
  const data = await scrapeTipsport(matches);
  if (data.error) return res.status(500).send(data.error);
  res.status(200).json(data);
  console.log("local matches", matches);
});

const port = 6969;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
