export interface QueryResult {
  error?: string;
  columns: string[];
  rows: Record<string, any>[];
}
