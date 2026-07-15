import {
  contract,
  type Answers,
  type ConfidenceLevel,
  type DimensionId,
  type EngineResult,
  type OptionDef,
  type QuestionDef,
} from "./types";

export const CONTEXT_QUESTIONS: QuestionDef[] = contract.content.context_questions;
export const MEASURED_QUESTIONS: QuestionDef[] = contract.content.questions;
export const DIMENSIONS = contract.rules.dimensions;

export function findOption(question: QuestionDef, optionId: string): OptionDef | undefined {
  return question.options.find((o) => o.id === optionId);
}

export function findQuestion(qid: string): QuestionDef | undefined {
  return (
    CONTEXT_QUESTIONS.find((q) => q.id === qid) ??
    MEASURED_QUESTIONS.find((q) => q.id === qid)
  );
}

function classificationWeight(classification: string): number {
  return contract.rules.classifications[classification]?.weight ?? 0;
}

export function computePerDimensionScore(answers: Answers): Record<DimensionId, number> {
  const scores: Record<DimensionId, number> = {
    d1_flujo: 0,
    d2_conversion: 0,
    d3_consistencia: 0,
    d4_visibilidad: 0,
  };
  let unknownFeed = 0;

  for (const q of MEASURED_QUESTIONS) {
    const chosen = answers[q.id];
    if (!chosen) continue;
    const opt = findOption(q, chosen);
    if (!opt) continue;

    if (opt.classification === "unknown") {
      unknownFeed += 1; // feed_weight for d4
      continue;
    }
    if (opt.dimension_effect.via === "classification" && opt.dimension_effect.target) {
      scores[opt.dimension_effect.target] += classificationWeight(opt.classification);
    }
  }
  scores.d4_visibilidad += unknownFeed;
  return scores;
}

export function countUnknown(answers: Answers): number {
  let n = 0;
  for (const q of MEASURED_QUESTIONS) {
    const chosen = answers[q.id];
    if (!chosen) continue;
    const opt = findOption(q, chosen);
    if (opt?.classification === "unknown") n += 1;
  }
  return n;
}

export function computeConfidence(answers: Answers): ConfidenceLevel {
  const unknown = countUnknown(answers);
  let level: ConfidenceLevel = "baja";
  for (const t of contract.rules.confidence.thresholds) {
    if (unknown >= t.min_unknown && unknown <= t.max_unknown) {
      level = t.level;
      break;
    }
  }
  // Modifier: respondent_outside_sales caps at media
  for (const mod of contract.rules.confidence.modifiers) {
    if (mod.effect === "cap_confidence_at_media") {
      if (answers[mod.when.question_id] === mod.when.option_id && level === "alta") {
        level = "media";
      }
    }
  }
  return level;
}

export function resolve(answers: Answers): EngineResult {
  const perDimension = computePerDimensionScore(answers);
  const confidence = computeConfidence(answers);
  const unknownCount = countUnknown(answers);
  const evidenceLabels = collectFrictionEvidenceLabels(answers);

  const dims = contract.rules.resolution.priority_order;
  const scoresList = dims.map((d) => ({ d, s: perDimension[d] }));
  const maxScore = Math.max(...scoresList.map((x) => x.s));

  // Step 1: sin_restriccion — all <= 2
  if (scoresList.every((x) => x.s <= 2)) {
    return baseResult({
      outcome: "sin_restriccion_clara",
      dominantDimension: null,
      dominantDimensions: [],
      perDimension,
      confidence,
      unknownCount,
      evidenceLabels,
      answers,
    });
  }

  // Step 2 & 3 & 4: only consider >=3
  if (maxScore >= 3) {
    const tied = scoresList.filter((x) => x.s === maxScore).map((x) => x.d);
    if (tied.length === 1) {
      return baseResult({
        outcome: "dominante",
        dominantDimension: tied[0],
        dominantDimensions: [tied[0]],
        perDimension,
        confidence,
        unknownCount,
        evidenceLabels,
        answers,
      });
    }
    // Tied. If includes d4 → resolve to d4.
    if (tied.includes("d4_visibilidad")) {
      return baseResult({
        outcome: "dominante",
        dominantDimension: "d4_visibilidad",
        dominantDimensions: ["d4_visibilidad"],
        perDimension,
        confidence,
        unknownCount,
        evidenceLabels,
        answers,
      });
    }
    // Co-dominancia — ordered by priority_order, capped at max_fronts
    const ordered = dims.filter((d) => tied.includes(d)).slice(0, contract.rules.resolution.max_fronts);
    return baseResult({
      outcome: "co_dominancia",
      dominantDimension: ordered[0] ?? null,
      dominantDimensions: ordered,
      perDimension,
      confidence,
      unknownCount,
      evidenceLabels,
      answers,
    });
  }

  // Fallback: no dominant but not all <=2 (e.g., 2s with a single 2). Treat as sin_restriccion.
  return baseResult({
    outcome: "sin_restriccion_clara",
    dominantDimension: null,
    dominantDimensions: [],
    perDimension,
    confidence,
    unknownCount,
    evidenceLabels,
    answers,
  });
}

function collectFrictionEvidenceLabels(answers: Answers): string[] {
  const labels: string[] = [];
  for (const q of MEASURED_QUESTIONS) {
    const chosen = answers[q.id];
    if (!chosen) continue;
    const opt = findOption(q, chosen);
    if (!opt) continue;
    if (opt.classification === "friction" || opt.classification === "weak_friction" || opt.classification === "unknown") {
      labels.push(`"${opt.label}"`);
    }
  }
  return labels;
}

function baseResult(args: {
  outcome: EngineResult["outcome"];
  dominantDimension: DimensionId | null;
  dominantDimensions: DimensionId[];
  perDimension: Record<DimensionId, number>;
  confidence: ConfidenceLevel;
  unknownCount: number;
  evidenceLabels: string[];
  answers: Answers;
}): EngineResult {
  const outsideIcp = args.answers["c1_tamano"] === "c1_gt_100";
  const respondentOutsideSales = args.answers["c2_relacion_venta"] === "c2_rol_otro";
  const d3SmallCompany = args.answers["c1_tamano"] === "c1_lt_10";
  return {
    ...args,
    modifiers: { outsideIcp, respondentOutsideSales, d3SmallCompany },
  };
}

export function getDimension(id: DimensionId) {
  return DIMENSIONS.find((d) => d.id === id)!;
}

export function getLibrary(id: DimensionId) {
  return contract.content.library[id];
}

/** Which reactive moment (if any) should show after answering questionId, considering already-shown moments. */
export function nextReactiveMoment(
  answeredQid: string,
  answers: Answers,
  shown: Set<string>,
): { id: string; text: string } | null {
  if (shown.size >= contract.rules.reactive.max_total) return null;
  const triggers = contract.rules.reactive.triggers;

  for (const t of triggers) {
    if (shown.has(t.moment_id)) continue;
    if (t.type === "post_context" && t.when === "after_question_answered" && t.question_id === answeredQid) {
      return textFor(t.moment_id);
    }
    if (t.type === "post_unknown" && t.when === "first_option_with_classification") {
      const q = findQuestion(answeredQid);
      const optId = answers[answeredQid];
      if (q && optId) {
        const opt = findOption(q, optId);
        if (opt?.classification === t.classification) {
          // first time? shown check above ensures only once
          return textFor(t.moment_id);
        }
      }
    }
    if (
      t.type === "mid_pattern" &&
      t.when === "after_question_if_any_dimension_score_gte" &&
      t.question_id === answeredQid
    ) {
      const scores = computePerDimensionScore(answers);
      if (Object.values(scores).some((s) => s >= (t.value ?? 3))) {
        return textFor(t.moment_id);
      }
    }
  }
  return null;
}

function textFor(momentId: string) {
  const m = contract.content.reactive_moments.find((x) => x.id === momentId);
  return m ? { id: m.id, text: m.text } : null;
}