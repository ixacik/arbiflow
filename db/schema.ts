import mongoose, { type InferSchemaType } from "mongoose";

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true },
  bookmaker: { type: String, required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  odds1: { type: Number },
  odds2: { type: Number },
  oddsTie: { type: Number },
});

export type MatchType = InferSchemaType<typeof matchSchema>;

export const Match = mongoose.model<MatchType>("odds", matchSchema);
