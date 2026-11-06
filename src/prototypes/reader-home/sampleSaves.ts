/**
 * The reader's saved articles and collections, as sample data that fits their
 * interests: a few articles for each interest they picked from the examples,
 * saved days to weeks ago, each in a collection named as they might have named
 * it ("Japan food list"). One may have a section added since it was saved.
 * Picked interests the prototype has nothing for (one found by search) add
 * none; with none matched — or interests skipped — the first three examples'
 * stand in.
 *
 * Made once, from the interests at the time a Curation module first needs them
 * (`savedSnapshot`), then fixed: changing interests later doesn't change what
 * the reader saved. Unsaving one with the article header's bookmark takes it
 * off the Home (and out of its collection); saving it again brings it back
 * (`unsavedArticles`, `useSavedArticlesSync`). Saving a new article isn't
 * remembered: the Home's content is the day's, so it would only show tomorrow.
 * A new account starts with none.
 */
import { computed, watch } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { hasSavedPages, readerInterests, savedSnapshot, unsavedArticles } from './readerFlowState'
import { EXAMPLE_TOPICS } from './readerHomeContent'

/* ---- Sample saves and collections, from the interests ---- */

interface InterestSaves {
  /** As the reader might have named it ("Japan food list", not the interest's name). */
  collection: string
  /** Most recently saved first. The second may carry a section added since it was saved. */
  saves: { article: string; newSection?: string }[]
}

/** By interest seed (`EXAMPLE_TOPICS`). `newSection`s are real sections of those articles. */
const SAVES_BY_INTEREST: Record<string, InterestSaves> = {
  'Arctic fox': {
    collection: 'Polar animals',
    saves: [{ article: 'Snowy owl' }, { article: 'Polar bear', newSection: 'Conservation status' }, { article: 'Walrus' }],
  },
  'Japanese cuisine': {
    collection: 'Japan food list',
    saves: [{ article: 'Sushi' }, { article: 'Ramen', newSection: 'Instant ramen' }, { article: 'Matcha' }],
  },
  'Black hole': {
    collection: 'Space stuff',
    saves: [{ article: 'Sagittarius A*' }, { article: 'Neutron star', newSection: 'Planets' }, { article: 'Event horizon' }],
  },
  'Ancient Egypt': {
    collection: 'Egypt trip',
    saves: [{ article: 'Rosetta Stone' }, { article: 'Valley of the Kings', newSection: 'Tourism' }, { article: 'Tutankhamun' }],
  },
  'Coral reef': {
    collection: 'Diving',
    saves: [{ article: 'Clownfish' }, { article: 'Great Barrier Reef' }, { article: 'Coral bleaching' }],
  },
  Volcano: {
    collection: 'Volcano reading',
    saves: [{ article: 'Mount Fuji' }, { article: 'Mount Vesuvius' }, { article: 'Yellowstone Caldera' }],
  },
}

const DEFAULT_SEEDS = EXAMPLE_TOPICS.slice(0, 3).map((topic) => topic.article)

/** The interests whose samples stand in, in the reader's order. */
const matched = computed(() => {
  const picked = readerInterests.value.map((interest) => interest.seed).filter((seed) => SAVES_BY_INTEREST[seed])
  return (picked.length ? picked : DEFAULT_SEEDS).map((seed) => SAVES_BY_INTEREST[seed])
})

export interface SavedArticle {
  article: string
  savedDaysAgo: number
  /** The collection it's in (samples only). */
  collection?: string
  /** A real section shown as added since it was saved (one sample). */
  newSection?: string
}

/**
 * The sample saves, most recent first: the interests taking turns, four days
 * apart from five days ago — so a few fall in Inside your saved articles'
 * 7–30 day window. Only the first interest's keeps its new section, so one card has it.
 */
const allSamples = computed<SavedArticle[]>(() => {
  const out: SavedArticle[] = []
  const longest = Math.max(...matched.value.map((group) => group.saves.length))
  for (let i = 0; i < longest; i++) {
    matched.value.forEach((group, groupIndex) => {
      const save = group.saves[i]
      if (!save) return
      out.push({
        article: save.article,
        savedDaysAgo: 5 + 4 * out.length,
        collection: group.collection,
        newSection: groupIndex === 0 ? save.newSection : undefined,
      })
    })
  }
  return out
})

/* ---- The saves, fixed once made ---- */

// Made the first time a Curation module is on, from the interests then.
watch(
  hasSavedPages,
  (on) => {
    if (on && !savedSnapshot.value) savedSnapshot.value = allSamples.value.map((save) => ({ ...save }))
  },
  { immediate: true },
)

/** Everything saved, unsaved ones included (so saving one again finds it). */
const allSaved = computed<SavedArticle[]>(() => savedSnapshot.value ?? allSamples.value)

/** The saves still saved, while a Curation module is on; none otherwise. */
export const sampleSaves = computed<SavedArticle[]>(() =>
  hasSavedPages.value ? allSaved.value.filter((save) => !unsavedArticles.value.includes(save.article)) : [],
)

/** The reader's collections: each with its articles still saved, updated when the latest went in. */
export const sampleCollections = computed(() => {
  const names = [...new Set(allSaved.value.map((save) => save.collection).filter(Boolean))] as string[]
  return names
    .map((name) => {
      const saves = sampleSaves.value.filter((save) => save.collection === name)
      return {
        name,
        articles: saves.map((save) => save.article),
        updatedDaysAgo: Math.min(...saves.map((save) => save.savedDaysAgo)),
      }
    })
    .filter((collection) => collection.articles.length)
})

/** "Saved today", "Saved yesterday", "Saved 9 days ago". */
export function savedAgo(days: number): string {
  return days === 0 ? 'Saved today' : days === 1 ? 'Saved yesterday' : `Saved ${days} days ago`
}

/**
 * Keep the article header's bookmark (the New user's reading list) and the
 * saves in step: the bookmark shows the saves as saved; unsaving one takes it
 * off the Home, and saving it again brings it back. Other articles' bookmarks
 * just flip for the visit.
 */
export function useSavedArticlesSync(): void {
  const { currentUserPageLists, setCurrentUserPageList } = useConfig()
  const titles = () => sampleSaves.value.map((save) => save.article)
  const same = (a: readonly string[], b: readonly string[]) => a.join('\n') === b.join('\n')

  // Saves → bookmark.
  watch(
    titles,
    (next) => {
      if (!same(next, currentUserPageLists.value.readingList)) setCurrentUserPageList('readingList', [...next])
    },
    { immediate: true },
  )

  // Bookmark → saves: only the saved articles' own unsaving and saving again count.
  watch(
    () => currentUserPageLists.value.readingList,
    (list) => {
      if (!hasSavedPages.value) return
      const known = allSaved.value.map((save) => save.article)
      const unsaved = known.filter((title) => !list.includes(title))
      if (!same(unsaved, unsavedArticles.value)) unsavedArticles.value = unsaved
    },
  )
}
