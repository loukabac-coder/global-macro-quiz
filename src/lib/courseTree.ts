import { CHAPTERS, type Chapter, type Section } from "@/lib/courses";
import { CORE_LESSONS } from "@/lib/courseLessons";
import { GROUPS, stageIndex, type ProgramLevel, type StudyGroup, type StudyUnit } from "@/lib/program";
import { searchText } from "@/lib/searchText";

type Lesson = {
  slug: string;
  title: string;
  level: ProgramLevel;
  sections: Section[];
  sources?: Chapter["sources"];
  legacy?: string;
};

// Un emplacement par section, dans l’ordre des anciennes fiches.
const locations: Record<string, string[]> = {
  "calcul-mental": ["06/pourcentages", "06/pourcentages", "06/pourcentages", "06/pourcentages", "06/unites", "06/unites", "06/unites", "06/interets", "06/pourcentages", "06/unites", "06/estimations"],
  "actions-et-indices": ["05/actions", "05/actions", "05/actions", "05/actions", "04/indices", "05/bases"],
  "capitalisations": ["04/capitalisations", "04/capitalisations", "04/capitalisations", "04/capitalisations", "04/indices", "04/capitalisations", "04/capitalisations"],
  "inflation": ["01/inflation", "01/inflation", "01/inflation", "02/institutions", "01/inflation", "01/inflation"],
  "banques-centrales": ["02/institutions", "02/taux", "02/institutions", "02/institutions"],
  "change": ["04/devises"],
  "matieres-premieres": ["04/matieres"],
  "politique-monetaire": ["02/taux", "02/taux", "02/taux", "02/taux", "05/obligations", "01/emploi", "02/instruments"],
  "macroeconomie": ["01/pib", "01/inflation", "01/emploi", "01/emploi", "01/finances", "01/commerce", "01/pib"],
  "obligations": ["05/obligations"],
  "derives": ["05/contrats", "05/options", "05/options", "05/options", "05/options", "05/contrats"],
  "guesstimates": ["06/estimations", "06/estimations", "06/estimations", "06/estimations", "06/estimations", "06/estimations"],
  "banques-centrales-intermediaire": ["02/instruments", "02/institutions", "02/taux", "02/decisions", "02/decisions"],
  "change-intermediaire": ["04/devises", "04/devises", "05/contrats"],
  "matieres-premieres-intermediaire": ["04/producteurs", "04/matieres", "05/contrats"],
  "banques-centrales-avance": ["02/decisions", "02/instruments", "02/taux", "02/taux"],
  "change-avance": ["04/devises", "05/contrats", "05/contrats"],
  "matieres-premieres-avance": ["05/contrats", "04/matieres"],
  "banques-centrales-expert": ["02/decisions"],
  "change-expert": ["05/contrats", "04/devises", "05/contrats"],
  "matieres-premieres-expert": ["05/contrats", "04/producteurs", "05/contrats"],
};

const locationKey = (group: StudyGroup, unit: StudyUnit) => `${group.no}/${unit.slug}`;
function slugOf(title: string) {
  return searchText(title).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const historicLessons = CHAPTERS.flatMap((chapter) => {
  const spots = locations[chapter.slug];
  if (!spots) throw new Error(`Fiche de cours sans emplacement ${chapter.slug}`);
  return chapter.sections.map((section, i) => {
    const title = section.title.replace(/^\d+\.\s*/, "");
    const spot = spots.length === 1 ? spots[0] : spots[i];
    const level = chapter.difficulty === "expert" ? "advanced" : chapter.difficulty ?? (i === 0 ? "beginner" : "intermediate");
    const lesson: Lesson = {
      slug: `${slugOf(title)}-${chapter.slug.replace(/-expert$/, "-approfondissement")}`,
      title, level, sections: [
        ...(i === 0 ? [{ title: chapter.title, paragraphs: [chapter.intro] }] : []),
        { ...section, title },
        ...(i === chapter.sections.length - 1 ? [
          { title: "À retenir", bullets: chapter.remember },
          ...(chapter.interview?.length ? [{ title: "Questions d’entretien", bullets: chapter.interview }] : []),
        ] : []),
      ],
      sources: chapter.sources, legacy: i === 0 ? chapter.slug : undefined,
    };
    return { spot, lesson };
  });
});

export function lessonsFor(group: StudyGroup, unit: StudyUnit) {
  const key = locationKey(group, unit);
  const core: Lesson[] = CORE_LESSONS[key].map(([title, level, explanation, example]) => ({
    slug: slugOf(title), title, level, sections: [{ title, paragraphs: [explanation], example }],
  }));
  const history = historicLessons.filter(({ spot }) => spot === key).map(({ lesson }) => lesson);
  return [
    ...core,
    ...history.sort((a, b) => stageIndex(a.level) - stageIndex(b.level)),
  ];
}

export function lessonHref(group: StudyGroup, unit: StudyUnit, page: Lesson) {
  return `/cours/${group.slug}/${unit.slug}/${page.slug}`;
}

export function legacyLessonHref(slug: string) {
  const entry = historicLessons.find(({ lesson }) => lesson.legacy === slug);
  if (!entry) return;
  const [number, name] = entry.spot.split("/");
  const group = GROUPS.find((candidate) => candidate.no === number)!;
  const unit = group.units.find((candidate) => candidate.slug === name)!;
  return lessonHref(group, unit, entry.lesson);
}
