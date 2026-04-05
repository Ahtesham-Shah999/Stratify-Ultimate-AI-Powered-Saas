import { create } from "zustand";

// API 1 parsed strategy
export interface ParsedStrategy {
  owner_id?: string;
  name?: string;
  description?: string;
  language_input?: string;

  generated_rules?: {
    pair?: string | null;
    indicator?: string | null;
    buy?: string | null;
    sell?: string | null;
    stop_loss?: number | null;
    take_profit?: number | null;
  };

  initial_capital?: number | null;

  meta?: {
    symbols?: string[];
    initial_capital?: number;
    rule_count?: number;
  };

  warnings?: string[];
}

// Strong typed alternative for suggested_changes instead of any[]
export interface SuggestedChange {
  field: string;
  message: string;
  before?: string | number | null;
  after?: string | number | null;
}

// API 2 validated strategy
export interface ValidatedStrategy {
  valid: boolean;
  errors: string[];
  warnings: string[];
  risk_score: number;
  suggested_changes: SuggestedChange[];
}

// UI normalized fields
export interface UI_Strategy {
  strategy_name?: string;
  pair?: string | null;
  capital?: number | null;
  conditions?: any[];
  description?: string;
  indicator?: string | null;
  buy?: string | null;
  sell?: string | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  visibility?: string;
}

interface StrategyStore {
  parsed: ParsedStrategy | null;        // API 1
  validated: ValidatedStrategy | null;  // API 2
  ui: UI_Strategy | null;               // normalized UI format
  strategyDbId: string | null;          // _id of an already-saved strategy

  setParsed: (data: ParsedStrategy) => void;
  setValidated: (data: ValidatedStrategy) => void;
  setUI: (data: UI_Strategy) => void;
  setStrategyDbId: (id: string | null) => void;

  // merges and prepares UI fields
  normalizeForUI: () => void;

  reset: () => void;
}

export const useStrategyStore = create<StrategyStore>((set, get) => ({
  parsed: null,
  validated: null,
  ui: null,
  strategyDbId: null,

  // store parsed strategy
  setParsed: (data) => set({ parsed: data }),

  // store validated strategy
  setValidated: (data) => set({ validated: data }),

  // directly update UI state (used after saving)
  setUI: (data) => set({ ui: data }),

  // set the DB id of an existing saved strategy
  setStrategyDbId: (id) => set({ strategyDbId: id }),

  // create UI-friendly version
  normalizeForUI: () => {
    const parsed = get().parsed;
    if (!parsed) return;

    const conditions: any[] = [];
    
    // Auto-fill Buy Condition Row
    if (parsed.generated_rules?.buy && parsed.generated_rules?.indicator) {
      conditions.push({
        indicator: parsed.generated_rules.indicator,
        operator: "<=",
        value: parsed.generated_rules.buy,
        action: "BUY"
      });
    }

    // Auto-fill Sell Condition Row
    if (parsed.generated_rules?.sell && parsed.generated_rules?.indicator) {
      conditions.push({
        indicator: parsed.generated_rules.indicator,
        operator: ">=",
        value: parsed.generated_rules.sell,
        action: "SELL"
      });
    }

    const ui: UI_Strategy = {
      strategy_name: parsed.name ?? "My Strategy",
      description: parsed.description ?? "",
      pair: parsed.generated_rules?.pair ?? null,
      capital: parsed.initial_capital ?? null,
      // Extracted flat properties
      indicator: parsed.generated_rules?.indicator ?? null,
      buy: parsed.generated_rules?.buy ?? null,
      sell: parsed.generated_rules?.sell ?? null,
      stop_loss: parsed.generated_rules?.stop_loss ?? null,
      take_profit: parsed.generated_rules?.take_profit ?? null,
      // Map rules to table rows
      conditions: conditions.length > 0 ? conditions : undefined
    };

    set({ ui });
  },

  // reset everything
  reset: () =>
    set({
      parsed: null,
      validated: null,
      ui: null,
      strategyDbId: null,
    }),
}));
