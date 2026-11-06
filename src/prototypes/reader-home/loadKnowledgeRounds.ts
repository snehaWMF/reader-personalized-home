/**
 * "Which came first?" rounds for the reader's seeds (interests, saved pages):
 * the hand-picked rounds for each seed the prototype knows
 * (`INTEREST_GAME_ROUNDS`), each saying which seed it came from, interleaved
 * so the seeds take turns; with the articles' pictures, live. Which side is
 * which changes by day, so the earlier one isn't always on the left.
 *
 * Hand-picked, not found: articles like a seed rarely have dates that answer
 * "which came first" truly (when a species was first described isn't when it
 * appeared), or pair two of the same kind of thing.
 */

import { fetchReadingListPages } from '../template-saved-pages/fetchReadingListPages'
import { utcDayKey } from '../template-home/homeCache'
import type { RelatedSeed } from './loadRelatedReads'
import { INTEREST_GAME_ROUNDS } from './moreModulesContent'

export interface GameOption {
  article: string
  description?: string
  thumbnailUrl?: string
  /** As revealed, after `label`: "1990", "c. 2670 BC". */
  year: string
  /** What the date is: "Launched", "Born"… */
  label?: string
  /** For comparing: the year, negative BC. */
  sortYear: number
}

export interface GameRound {
  a: GameOption
  b: GameOption
  first: 'a' | 'b'
  /** Why it's here: "Related to Black holes", "Randomly selected". */
  reason: string
}

/** Same number for the same text, so a day's sides are stable. */
function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0
  return Math.abs(value)
}

/** Seeds' rounds interleaved — the first of each, then the second of each… */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  for (let round = 0; lists.some((list) => list.length > round); round++) {
    lists.forEach((list) => list[round] && out.push(list[round]))
  }
  return out
}

export async function loadKnowledgeRounds(seeds: readonly RelatedSeed[], signal: AbortSignal): Promise<GameRound[]> {
  const day = utcDayKey()
  const seen = new Set<string>()
  const rounds = interleave(
    seeds.map((seed) =>
      (INTEREST_GAME_ROUNDS[seed.title] ?? [])
        // A round two seeds share (a saved page and its subject) plays once.
        .filter((round) => !seen.has(round.a.article) && seen.add(round.a.article))
        .map((round): GameRound => {
          const [a, b] = hash(`${round.a.article}${day}`) % 2 ? [round.a, round.b] : [round.b, round.a]
          return { a: { ...a }, b: { ...b }, first: a.sortYear < b.sortYear ? 'a' : 'b', reason: seed.reason }
        }),
    ),
  )
  if (!rounds.length) return rounds

  // Pictures, live; a failed load leaves the cards without.
  const titles = rounds.flatMap((round) => [round.a.article, round.b.article])
  try {
    const pages = await fetchReadingListPages(titles, { signal, lang: 'en' })
    const thumbs = new Map<string, string>()
    pages.forEach((page, index) => {
      if (page.kind === 'page' && page.thumbnailUrl) thumbs.set(titles[index], page.thumbnailUrl)
    })
    rounds.forEach((round) => {
      round.a.thumbnailUrl = thumbs.get(round.a.article)
      round.b.thumbnailUrl = thumbs.get(round.b.article)
    })
  } catch (error) {
    if (signal.aborted) throw error
  }
  return rounds
}
