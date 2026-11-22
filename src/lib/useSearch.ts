import { useSearchParams } from "next/navigation";

export function useSearch(): string {
  return useSearchParams().toString();
}
