import { getLocalSetting, setLocalSetting } from '../database/db';

const PERSONALIZED_SUGGESTIONS_KEY = 'personalized_suggestions_enabled';

/**
 * The free-time suggestion is the one place Anchor uses something that
 * could be called "personalization" (matching estimated task durations
 * against calendar gaps). There's no separate learned profile to wipe -
 * the matching is computed fresh each time from current tasks/events, not
 * from an accumulating model - so turning this off *is* the reset: it
 * simply stops using that behavior to make suggestions.
 */
export async function arePersonalizedSuggestionsEnabled(): Promise<boolean> {
  const value = await getLocalSetting(PERSONALIZED_SUGGESTIONS_KEY);
  return value !== 'false';
}

export async function setPersonalizedSuggestionsEnabled(enabled: boolean): Promise<void> {
  await setLocalSetting(PERSONALIZED_SUGGESTIONS_KEY, enabled ? 'true' : 'false');
}
