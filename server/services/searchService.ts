import * as searchRepo from "../repositories/searchRepository";
import type { SearchResults } from "../repositories/searchRepository";

export async function search(query: string): Promise<SearchResults> {
  if (!query || query.trim().length < 2) {
    return { courses: [], posts: [] };
  }
  return await searchRepo.search(query.trim());
}
