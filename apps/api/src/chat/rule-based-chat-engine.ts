import type {
  ChatIntent,
  ChatReplyDto,
  ChatRequest,
  ChatSuggestionDto,
} from '@pastalavista/shared';
import type { ChatEngine } from '../domain/ports/system';
import type { CatalogService } from '../domain/services/catalog-service';
import { CHAT_TEXTS, KEYWORDS } from './chat-texts';
import { buildCandidates, compareByNeed, type Candidate } from './plate-candidates';

const CENTS_PER_EURO = 100;
const DEFAULT_BUDGET_CENTS = 1000;
const MAX_SUGGESTIONS = 2;
// Nombre en euros précédé ou suivi du symbole, ex. « moins de 12 € », « under 12 », « до 12 »
const AMOUNT_PATTERN = /([0-9]+(?:[.,][0-9]{1,2})?)/;

interface Needs {
  slowCarbs: boolean;
  protein: boolean;
  budgetCents: number | null;
}

function includesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectBudget(text: string): number | null {
  if (!includesAny(text, KEYWORDS.budget)) return null;
  const amount = AMOUNT_PATTERN.exec(text)?.[1];
  return amount
    ? Math.round(Number(amount.replace(',', '.')) * CENTS_PER_EURO)
    : DEFAULT_BUDGET_CENTS;
}

function detectNeeds(text: string): Needs {
  return {
    slowCarbs: includesAny(text, KEYWORDS.slowCarbs),
    protein: includesAny(text, KEYWORDS.protein),
    budgetCents: detectBudget(text),
  };
}

function hasNeed(needs: Needs): boolean {
  return needs.slowCarbs || needs.protein || needs.budgetCents !== null;
}

function detectIntent(text: string, needs: Needs): ChatIntent {
  if (includesAny(text, KEYWORDS.callStaff)) return 'call-staff';
  if (hasNeed(needs)) return 'recommend';
  if (includesAny(text, KEYWORDS.menu)) return 'show-menu';
  if (includesAny(`${text} `, KEYWORDS.greeting)) return 'greeting';
  return 'fallback';
}

function toSuggestion(candidate: Candidate, index: number): ChatSuggestionDto {
  return {
    id: `suggestion-${index + 1}`,
    title: candidate.title,
    lines: [candidate.line],
    totals: candidate.totals,
  };
}

/**
 * Chatbot à règles : détecte un besoin (sucres lents, protéines, budget) dans fr / en / ru
 * puis propose uniquement des plats construits à partir du catalogue réel. Aucun message n'est conservé.
 */
export class RuleBasedChatEngine implements ChatEngine {
  constructor(private readonly catalog: CatalogService) {}

  async reply(request: ChatRequest): Promise<ChatReplyDto> {
    const texts = CHAT_TEXTS[request.locale];
    const text = request.message.toLowerCase();
    const needs = detectNeeds(text);
    const intent = detectIntent(text, needs);
    const base = {
      locale: request.locale,
      intent,
      callStaff: intent === 'call-staff',
      suggestions: [],
    };

    switch (intent) {
      case 'call-staff':
        return { ...base, text: texts.callStaff };
      case 'greeting':
        return { ...base, text: texts.greeting };
      case 'fallback':
        return { ...base, text: texts.fallback };
      case 'show-menu':
        return { ...base, text: texts.menu, suggestions: await this.popularSuggestions(request) };
      case 'recommend':
        return this.recommend(request, needs, base);
    }
  }

  private async popularSuggestions(request: ChatRequest): Promise<ChatSuggestionDto[]> {
    const products = await this.catalog.listProducts(request.locale);
    return buildCandidates(products)
      .filter((candidate) => candidate.isComposition)
      .map(toSuggestion);
  }

  private async recommend(
    request: ChatRequest,
    needs: Needs,
    base: Omit<ChatReplyDto, 'text'>,
  ): Promise<ChatReplyDto> {
    const texts = CHAT_TEXTS[request.locale];
    const candidates = buildCandidates(await this.catalog.listProducts(request.locale));
    const matching = candidates
      .filter((c) => !needs.slowCarbs || c.slowCarbs)
      .filter((c) => needs.budgetCents === null || c.totals.totalCents <= needs.budgetCents)
      .sort(compareByNeed);

    if (matching.length === 0) {
      const cheapest = [...candidates].sort((a, b) => a.totals.totalCents - b.totals.totalCents)[0];
      return {
        ...base,
        text: texts.budgetTooLow,
        suggestions: cheapest ? [toSuggestion(cheapest, 0)] : [],
      };
    }
    const best = matching[0] as Candidate;
    const popular = matching.find((c) => c.isComposition && c !== best);
    const picks = [best, ...(popular ? [popular] : [])].slice(0, MAX_SUGGESTIONS);
    return { ...base, text: texts.recommend, suggestions: picks.map(toSuggestion) };
  }
}
