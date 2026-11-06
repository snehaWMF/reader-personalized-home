/**
 * The Home's "Daily reads" seeds (and "Wikipedia in pictures"), from the
 * flow's state: the reader's picked interests, once personalized. Saved
 * articles add none (`savedSeeds` is always empty). A reader who skipped interests gets the non-personalized
 * Home: the featured article and random picks. Each card says which it came from.
 * Which of these the module actually draws on is the reader's choice
 * (`ReaderDailyReads`, `dailyReadsChoices`).
 */
import { computed } from 'vue'

import type { RelatedSeed } from './loadRelatedReads'
import { personalized, readerInterests } from './readerFlowState'

/** Cards in Daily reads, in every concept. */
export const DAILY_READS_COUNT = 4

export function useDailyReadsSeeds() {
  const interestSeeds = computed<RelatedSeed[]>(() =>
    personalized.value
      ? readerInterests.value.map((interest) => ({
          title: interest.seed,
          reason: `Related to ${interest.name}`,
        }))
      : [],
  )

  /*
   * Saved articles don't seed the other modules in the prototype: they stay
   * interest-based, and saving only changes Inside your saved articles. Their
   * Customize menus still offer "Related to articles you saved", for
   * demonstration; it adds nothing.
   */
  const savedSeeds = computed<RelatedSeed[]>(() => [])

  return { interestSeeds, savedSeeds }
}
