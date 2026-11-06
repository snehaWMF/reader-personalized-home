/**
 * Articles like a few seed pages, each card saying why it's there. The Home's
 * Daily reads lookup (CirrusSearch `morelike:`), with a reason per seed.
 */

import { cdxIconDie } from '@wikimedia/codex-icons'

import type { HomeArticleCard } from '../template-home/HomeArticleCards.vue'
import { readDayCache, utcDayKey, writeDayCache } from '../template-home/homeCache'
import { fetchMorelike, type MorelikeHit } from '../template-home/loadDailyReads'
import { titleKey } from '../template-home/useHomeSeeds'
import { RANDOM_TOPICS } from './readerHomeContent'

/** English Wikipedia's short description on disambiguation pages — not a read. */
const DISAMBIGUATION = 'Topics referred to by the same term'

export interface RelatedSeed {
  title: string
  /** The card's supporting line, e.g. "Because you saved Morpho". */
  reason: string
}

/** A shuffled copy. */
function shuffled<T>(items: readonly T[]): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

/**
 * Up to `count` articles like `seeds`. With more seeds than cards, `count` of
 * them are picked at random, one card each; with fewer, they're interleaved
 * round-robin so the cards mix seeds. Duplicates and the seeds themselves are
 * dropped. Cached per day, slot and seed set, so the Home doesn't reshuffle on
 * every visit.
 */
export async function loadRelatedReads(
  slot: string,
  seeds: readonly RelatedSeed[],
  count: number,
  signal: AbortSignal,
): Promise<HomeArticleCard[]> {
  if (!seeds.length) return []
  const cacheKey = `${utcDayKey()}|${count}|${seeds.map((seed) => titleKey(seed.title)).join('|')}`
  const cached = readDayCache<HomeArticleCard>(`reader-${slot}`, cacheKey)
  if (cached) return cached

  const picked = seeds.length > count ? shuffled(seeds).slice(0, count) : [...seeds]
  // One spare hit per seed leaves headroom for cross-seed duplicates.
  const perSeed = Math.ceil(count / picked.length) + 1
  const batches: MorelikeHit[][] = []
  for (const seed of picked) {
    // One seed failing shouldn't cost the others.
    batches.push(
      await fetchMorelike(seed.title, perSeed, signal).catch((error: unknown) => {
        if (signal.aborted) throw error
        return []
      }),
    )
  }

  const seen = new Set(seeds.map((seed) => titleKey(seed.title)))
  const cards: HomeArticleCard[] = []
  for (let round = 0; cards.length < count && round < perSeed; round++) {
    batches.forEach((hits, index) => {
      const hit = hits[round]
      if (!hit || cards.length >= count || seen.has(titleKey(hit.title))) return
      if (hit.description === DISAMBIGUATION) return
      seen.add(titleKey(hit.title))
      cards.push({
        title: hit.title,
        description: hit.description,
        thumbnailUrl: hit.thumbnailUrl,
        supportingText: picked[index].reason,
      })
    })
  }

  writeDayCache(`reader-${slot}`, cacheKey, cards)
  return cards
}

/**
 * Recommendations for a reader with nothing to grow from: for each card, a
 * random familiar topic (`RANDOM_TOPICS`) and an article like it, saying
 * "Randomly selected" beside a die. Cached per day and count.
 */
export async function loadRandomReads(count: number, signal: AbortSignal): Promise<HomeArticleCard[]> {
  const slot = `reader-random-topics-v5-${count}`
  const cacheKey = utcDayKey()
  const cached = readDayCache<HomeArticleCard>(slot, cacheKey)
  if (cached) return cached

  // Shuffled, so each day draws a different few; a topic with no usable match is skipped.
  const topics = shuffled(RANDOM_TOPICS)

  const seen = new Set(topics.map(titleKey))
  const cards: HomeArticleCard[] = []
  for (const topic of topics) {
    if (cards.length >= count) break

    const hits = await fetchMorelike(topic, 3, signal).catch((error: unknown) => {
      if (signal.aborted) throw error
      return []
    })
    const hit = hits.find(
      (candidate) => candidate.description !== DISAMBIGUATION && !seen.has(titleKey(candidate.title)),
    )
    if (!hit) continue
    seen.add(titleKey(hit.title))
    cards.push({
      title: hit.title,
      description: hit.description,
      thumbnailUrl: hit.thumbnailUrl,
      supportingText: 'Randomly selected',
      supportingIcon: cdxIconDie,
    })
  }

  writeDayCache(slot, cacheKey, cards)
  return cards
}
