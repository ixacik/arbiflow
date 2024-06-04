export type Match = {
  bookmaker: string;
  team1: string;
  team2: string;
  embedding1: number[];
  embedding2: number[];
  odds1: number | null;
  odds2: number | null;
  oddsTie: number | null;
};
