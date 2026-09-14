import type { Category } from '../../types';

export interface BrainDumpParsedItem {
  title: string;
  category: string;
  dueDate: string | null;
}

export interface BrainDumpParseResult {
  items: BrainDumpParsedItem[];
}

// Small built-in keyword -> category-name-hint table. A line is matched
// against these keywords, then the first of the user's own categories
// whose name contains one of the matched hint's nameHints is used.
const KEYWORD_CATEGORY_HINTS: { keywords: string[]; nameHints: string[] }[] = [
  { keywords: ['pay', 'bill', 'rent', 'invoice', 'budget', 'expense'], nameHints: ['money', 'finance', 'bill'] },
  { keywords: ['call', 'email', 'meet', 'meeting', 'project', 'report', 'client'], nameHints: ['work'] },
  { keywords: ['study', 'homework', 'assignment', 'exam', 'class', 'school'], nameHints: ['school', 'student'] },
  { keywords: ['doctor', 'gym', 'workout', 'medicine', 'appointment'], nameHints: ['health'] },
  { keywords: ['clean', 'grocery', 'groceries', 'laundry', 'repair', 'fix'], nameHints: ['home'] },
  { keywords: ['birthday', 'gift', 'family', 'friend'], nameHints: ['family', 'social', 'personal'] },
];

function findCategoryForLine(line: string, categories: Category[]): string {
  const lower = line.toLowerCase();
  const fallback = categories.find((c) => c.isDefault)?.name ?? categories[0]?.name ?? 'Other';

  for (const hint of KEYWORD_CATEGORY_HINTS) {
    if (!hint.keywords.some((keyword) => lower.includes(keyword))) continue;
    const match = categories.find((c) => hint.nameHints.some((nameHint) => c.name.toLowerCase().includes(nameHint)));
    if (match) return match.name;
  }

  return fallback;
}

/**
 * Rule-based replacement for the old LLM-parsed brain dump: one task per
 * line instead of free-paragraph parsing, category guessed by keyword
 * match against the user's own categories. No date parsing - resolving
 * phrases like "Monday" to a real date needs language understanding, so
 * dueDate is always null; the user sets it manually if needed.
 */
export function parseBrainDumpText(text: string, categories: Category[]): BrainDumpParseResult {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({
      title: line,
      category: findCategoryForLine(line, categories),
      dueDate: null as string | null,
    }));

  return { items };
}
