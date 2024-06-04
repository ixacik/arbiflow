import { pgTable, uuid, varchar, vector } from "drizzle-orm/pg-core";

export const embeddedTeams = pgTable("embedded_teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull().unique(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});

export type embeddedTeam = typeof embeddedTeams.$inferSelect;
export type embeddedTeamInsert = typeof embeddedTeams.$inferInsert;
