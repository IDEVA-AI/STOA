import * as searchRepo from "../repositories/searchRepository";
import type { SearchResults } from "../repositories/searchRepository";

export function search(query: string): SearchResults {
  if (!query || query.trim().length < 2) {
    return { courses: [], posts: [] };
  }
  return searchRepo.search(query.trim());
}
