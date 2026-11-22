import { readMacroSnapshot, readMarketCapsSnapshot } from "@/lib/dataSnapshots";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "macro" && type !== "capitalisations") {
    return Response.json({ error: "Type de données inconnu." }, { status: 400 });
  }
  const data = await (type === "macro" ? readMacroSnapshot() : readMarketCapsSnapshot());
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
