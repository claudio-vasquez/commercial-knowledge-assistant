import contractJson from "./contract.json";

export const contract = contractJson as unknown as DiagnosticContract;

export type Classification =
  | "friction"
  | "weak_friction"
  | "no_friction"
  | "unknown"
  | "context_only";

export type DimensionId =
  | "d1_flujo"
  | "d2_conversion"
  | "d3_consistencia"
  | "d4_visibilidad";

export type ConfidenceLevel = "alta" | "media" | "baja";

export interface OptionDef {
  id: string;
  label: string;
  classification: Classification;
  dimension_effect: { target: DimensionId | null; via: string };
  confidence_effect: string;
  signals?: string[];
  rival_signals?: string[];
}

export interface QuestionDef {
  id: string;
  code: string;
  text: string;
  dimension?: DimensionId;
  pattern_id?: string;
  options: OptionDef[];
}

export interface DimensionDef {
  id: DimensionId;
  code: string;
  name_internal: string;
  name_public: string;
  sensor_ids: string[];
  meta_dimension: boolean;
}

export interface LibraryEntry {
  pattern_id: string;
  pattern_name: string;
  partial: { reading: string; hypothesis: string; micro_help: string };
  full: {
    first_moves: string[];
    postpone: string[];
    how_to_confirm: string;
    limits: string;
  };
  rival_hypothesis: string;
  methodological_notes: string[];
  context_variants: Record<string, { id: string; lead_in: string }>;
}

export interface DiagnosticContract {
  meta: {
    version: string;
    consent_purpose: string;
    limitations: string[];
    public_promise: { core: string; typical_form: string };
  };
  rules: {
    dimensions: DimensionDef[];
    classifications: Record<string, { weight: number }>;
    confidence: {
      thresholds: { level: ConfidenceLevel; min_unknown: number; max_unknown: number }[];
      modifiers: {
        id: string;
        when: { question_id: string; option_id: string };
        effect: string;
        note_ref: string;
      }[];
    };
    resolution: {
      priority_order: DimensionId[];
      max_fronts: number;
      steps: {
        order: number;
        id: string;
        condition: string;
        value: number;
        outcome: string;
        dimension?: DimensionId;
        resolve_to?: DimensionId;
        fronts_rule?: string;
      }[];
    };
    reactive: {
      max_total: number;
      max_per_type: number;
      triggers: {
        moment_id: string;
        type: string;
        when: string;
        question_id?: string;
        value?: number;
        classification?: string;
      }[];
    };
    interpretation_modifiers: {
      id: string;
      when: { question_id: string; option_id: string };
      applies_to_dimension: DimensionId | "all";
      effect: string;
      variant_ref?: string;
      note_ref?: string;
    }[];
  };
  content: {
    intro: {
      headline_promise: string;
      cost_line: string;
      value_first_line: string;
      unknown_hint: string;
    };
    context_questions: QuestionDef[];
    questions: QuestionDef[];
    reactive_moments: { id: string; type: string; text: string }[];
    library: Record<DimensionId, LibraryEntry>;
    outcomes: {
      dominante: { id: string; intro_template: string };
      co_dominancia: { id: string; intro_template: string; guidance: string };
      sin_restriccion_clara: {
        id: string;
        title: string;
        reading: string;
        what_to_watch: string;
        postpone: string;
        honest_note: string;
      };
    };
    confidence: {
      alta: string;
      media: string;
      baja: string;
      modifier_notes: { respondent_outside_sales: string };
    };
    templates: {
      partial_result: { trace_line: string };
      gate: { freedom_text: string };
    };
    cta: { id: string; label: string; framing: string; target: string };
    notes: { outside_icp: string };
  };
  persistence: { lead_source_value: string };
}

export type Answers = Record<string, string>; // question_id -> option_id

export interface EngineResult {
  outcome: "dominante" | "co_dominancia" | "sin_restriccion_clara";
  dominantDimension: DimensionId | null;
  dominantDimensions: DimensionId[];
  confidence: ConfidenceLevel;
  unknownCount: number;
  perDimension: Record<DimensionId, number>;
  evidenceLabels: string[];
  modifiers: { outsideIcp: boolean; respondentOutsideSales: boolean; d3SmallCompany: boolean };
}