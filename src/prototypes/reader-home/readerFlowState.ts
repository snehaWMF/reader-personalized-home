/**
 * The reader Home flow's own state, kept across reloads in localStorage: the
 * interests the reader picked, whether they have saved pages, and the Home
 * concept being shown. Module-level, so every page of the flow shares it.
 *
 * The Home has two states: personalized (interests picked) and not
 * personalized (the reader skipped picking).
 */
import { computed, ref, watch } from 'vue'

import { DEFAULT_PICKED_INTERESTS, type PickedInterest, type ReaderInterest } from './readerHomeContent'

const STORAGE_PREFIX = 'protowiki-reader-home:'

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Caches that are safe to throw away: ProtoWiki keeps each article's page
 * (up to a megabyte or so) and the Home's day caches in the same storage, and
 * after a few articles they can fill it — at which point the reader's own
 * state (interests, modules…) would silently stop saving.
 */
const DISPOSABLE_PREFIXES = ['protowiki:articleBody:', 'protowiki:articleView:', 'protowiki-template-home-cache-v1:']

function clearDisposableCaches(): void {
  const store = window.localStorage
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i)
    if (key && DISPOSABLE_PREFIXES.some((prefix) => key.startsWith(prefix))) store.removeItem(key)
  }
}

function writeStored(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, raw)
  } catch {
    // Most likely full: make room by dropping the caches, then try once more.
    try {
      clearDisposableCaches()
      window.localStorage.setItem(STORAGE_PREFIX + key, raw)
    } catch {
      // Unavailable storage must never break the flow.
    }
  }
}

export function persisted<T>(key: string, fallback: T) {
  const value = ref(readStored(key, fallback))
  watch(value, (next) => writeStored(key, next), { deep: true })
  return value
}

/**
 * The articles the reader picked as their interests (on the interests screen):
 * each one seeds "Related to …" picks on the Home. Empty when they skipped.
 */
export const pickedInterests = persisted<PickedInterest[]>('interests-v5', [])

/* The last picks, so the prototype panel can switch personalization back on with them. */
const lastPickedInterests = persisted<PickedInterest[]>('last-interests-v5', [])
watch(pickedInterests, (picks) => {
  if (picks.length) lastPickedInterests.value = [...picks]
})

/** The Home's state: personalized once the reader has picked interests. */
export const personalized = computed(() => pickedInterests.value.length > 0)

/** On: the last picks (or the defaults). Off: as if the reader skipped. */
export function setPersonalized(on: boolean): void {
  pickedInterests.value = on
    ? [...(lastPickedInterests.value.length ? lastPickedInterests.value : DEFAULT_PICKED_INTERESTS)]
    : []
}

/** The picked interests, as the Home's modules read them. */
export const readerInterests = computed<ReaderInterest[]>(() =>
  pickedInterests.value.map((pick) => ({ id: pick.seed, name: pick.name, seed: pick.seed, count: 2 })),
)

/**
 * The Home's modules the prototype panel can turn on and off, in the order they
 * sit on the Home. `group` is the panel's grouping by type of module; none for
 * Daily reads, listed first.
 */
export const HOME_MODULES = [
  { id: 'daily-reads', label: 'Suggested reads', group: null },
  { id: 'daily-images', label: 'Wikipedia in pictures', group: 'short-form' },
  { id: 'interest-facts', label: 'Did you know…', group: 'short-form' },
  { id: 'rediscover', label: 'Inside your saved articles', group: 'curation' },
  { id: 'collections', label: 'Your collections', group: 'curation' },
  { id: 'knowledge-game', label: 'Challenge your knowledge', group: 'games' },
  { id: 'community-curated', label: 'Community curated', group: 'community' },
  { id: 'top-reads', label: 'Most read on Wikipedia this week', group: 'community' },
  { id: 'social-posts', label: 'Fun facts from Wikipedia', group: 'special' },
] as const

/** The prototype panel's groups of modules, in its order. */
export const HOME_MODULE_GROUPS = [
  { id: null, label: null },
  { id: 'short-form', label: 'Short form recos' },
  { id: 'curation', label: 'Curation' },
  { id: 'games', label: 'Games and challenges' },
  { id: 'community', label: 'Community' },
  { id: 'special', label: 'Special content' },
] as const

export type HomeModuleId = (typeof HOME_MODULES)[number]['id']

/** On for a new account; the rest are turned on one by one from the prototype panel. */
export const DEFAULT_HOME_MODULES: HomeModuleId[] = ['daily-reads']

/** The modules on the Home (the prototype panel's checklist). */
export const enabledModules = persisted<HomeModuleId[]>('modules-v2', [...DEFAULT_HOME_MODULES])

/** Always on the Home: the prototype panel can't turn these off. */
export const REQUIRED_HOME_MODULES: HomeModuleId[] = ['daily-reads']

export function moduleOn(id: HomeModuleId): boolean {
  return REQUIRED_HOME_MODULES.includes(id) || enabledModules.value.includes(id)
}

/**
 * Whether a Curation module is on (Inside your saved articles, Your
 * collections): only then are there sample saves.
 */
export const hasSavedPages = computed(() =>
  HOME_MODULES.some((module) => module.group === 'curation' && enabledModules.value.includes(module.id)),
)

/**
 * The reader's saved articles (`sampleSaves.ts`), fixed once first made from
 * their interests at the time: changing interests later doesn't change them.
 * Null for a new account until a Curation module first needs them.
 */
export const savedSnapshot = persisted<{ article: string; savedDaysAgo: number; collection?: string; newSection?: string }[] | null>(
  'saved-snapshot-v2',
  null,
)

/** Saved articles the reader unsaved with the bookmark: gone from the Home until saved again. */
export const unsavedArticles = persisted<string[]>('unsaved-v2', [])

/** The welcome screen's answer (`READER_PURPOSES`). */
export const readerPurpose = persisted<string | null>('purpose', null)

/** Here to edit too ("A bit of both" or "Editing and contributing"): the Home adds the editing modules. */
export const wantsEditing = computed(
  () => readerPurpose.value === 'both' || readerPurpose.value === 'editing',
)

/** Here mainly to edit ("Editing and contributing"): Suggested edits leads the Home, above Daily reads. */
export const editingFirst = computed(() => readerPurpose.value === 'editing')

/** Whether the reader has seen the popover pointing at the Home link on an article; reset with each new account. */
export const homeLinkHintSeen = persisted<boolean>('home-link-hint-seen', false)

/**
 * The not-personalized Home's interests prompt closed (`ReaderPersonalizePrompt`):
 * the Interests link takes its place by the tabs. Kept across reloads; a new
 * account brings it back.
 */
export const interestsPromptDismissed = persisted<boolean>('prompt-dismissed', false)

/** Point a popover at the Interests link once it appears, after the prompt is closed. */
export const interestsHintPending = ref(false)

/** What Daily reads can draw on, as the reader customizes it from its menu. */
export type DailyReadsSource = 'featured' | 'interests' | 'saved' | 'random'

/**
 * The reader's choices in Daily reads' "Customize" dialog; a source left out
 * keeps the module's default (`ReaderDailyReads`). Kept across reloads, like
 * the rest of the reader's state.
 */
export const dailyReadsChoices = persisted<Partial<Record<DailyReadsSource, boolean>>>('choices-reads', {})

/** What "Wikipedia in pictures" can draw on: as Daily reads, but no featured article. */
export type DailyImagesSource = Exclude<DailyReadsSource, 'featured'>

/** The reader's choices in its "Customize" dialog; kept too. */
export const dailyImagesChoices = persisted<Partial<Record<DailyImagesSource, boolean>>>('choices-images', {})

/** The reader's choices in "Did you know…"'s "Customize" dialog: the same sources as the pictures. */
export const interestFactsChoices = persisted<Partial<Record<DailyImagesSource, boolean>>>('choices-facts', {})

/** The reader's choices in "Challenge your knowledge"'s "Customize" dialog: the same sources again. */
export const knowledgeGameChoices = persisted<Partial<Record<DailyImagesSource, boolean>>>('choices-game', {})

/* Picking or skipping interests starts every "Customize" dialog over, on that state's defaults. */
watch(personalized, () => {
  dailyReadsChoices.value = {}
  dailyImagesChoices.value = {}
  interestFactsChoices.value = {}
  knowledgeGameChoices.value = {}
})
