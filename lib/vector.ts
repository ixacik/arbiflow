import OpenAI from "openai";
import * as tf from "@tensorflow/tfjs-node";
import "dotenv/config";
import { db } from "../db";
import { embeddedTeams } from "../db/schema";
import { eq } from "drizzle-orm";

export const COS_SIM_THRESHOLD = 0.8;

async function newEmbedding(teamName: string) {
  const openai = new OpenAI();

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: teamName,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

export async function cosineSimilarity(
  embedding1: number[],
  embedding2: number[],
) {
  const team1Vector = tf.tensor(embedding1);
  const team2Vector = tf.tensor(embedding2);

  const cosineSimilarity = tf.losses.cosineDistance(
    team1Vector,
    team2Vector,
    0,
  );
  const cosineDistance = 1 - cosineSimilarity.dataSync()[0];

  return cosineDistance;
}

export async function getEmbedding(teamName: string) {
  teamName = teamName.toLowerCase().trim();
  // query embedding from the database
  const data = await db
    .select()
    .from(embeddedTeams)
    .where(eq(embeddedTeams.name, teamName));
  let embedding = data[0]?.embedding;

  if (!embedding) {
    embedding = await newEmbedding(teamName);
    await db.insert(embeddedTeams).values({
      name: teamName,
      embedding,
    });
  }

  return { name: teamName, embedding };
}
