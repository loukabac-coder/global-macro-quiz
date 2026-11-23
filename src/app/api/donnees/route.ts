import { readMacroSnapshot, readMarketCapsSnapshot, readNewsSnapshot, readStudySources } from "@/lib/dataSnapshots";
import { buildStudyView, hasStudyReferences } from "@/lib/studyReferences";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const headers = { "Cache-Control": "no-store" };
  if (type === "reperes" || type === "memoire") {
    const scope = params.get("cours") ?? "";
    if (!hasStudyReferences(scope)) return Response.json({ error: "Cours inconnu." }, { status: 400 });
    const sources = await readStudySources();
    if (type === "memoire") {
      const { memoryDraw } = await import("@/lib/studyQuestions");
      return Response.json({ questions: memoryDraw(sources, scope, Date.now()) }, { headers });
    }
    return Response.json(buildStudyView(sources, scope, Date.now()), { headers });
  }
  if (type !== "macro" && type !== "capitalisations" && type !== "actualite") {
    return Response.json({ error: "Type de données inconnu." }, { status: 400 });
  }
  const data = await (type === "macro" ? readMacroSnapshot() : type === "capitalisations" ? readMarketCapsSnapshot() : readNewsSnapshot());
  return Response.json(data, { headers });
}
