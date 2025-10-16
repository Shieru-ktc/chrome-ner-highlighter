export interface NEREntity {
  entity_group:
    | "PER"
    | "ORG"
    | "ORG-P"
    | "ORG-O"
    | "LOC"
    | "INS"
    | "PRD"
    | "EVT";
  score: number;
  word: string;
  start: number;
  end: number;
}

export type NERResponse = NEREntity[];
