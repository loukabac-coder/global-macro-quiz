export function searchText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/œ/g, "oe").replace(/\s+/g, " ").trim();
}

export function matchesKeywords(index: string, query: string): boolean {
  return searchText(query).split(" ").every((word) => index.includes(word));
}
