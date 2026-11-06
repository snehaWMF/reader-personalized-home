import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { fetchReadingListPages } from '../template-saved-pages/fetchReadingListPages'

export interface ArticleSummary {
  thumbnailUrl?: string
  description?: string
}

/**
 * Thumbnails and short descriptions for a fixed set of articles, by the title
 * as given — for modules built from sample data. Empty until they load; a
 * failed load leaves them out.
 */
export function useArticleSummaries(titles: readonly string[]) {
  const summaries = shallowRef<Record<string, ArticleSummary>>({})
  const controller = new AbortController()

  onMounted(async () => {
    try {
      const pages = await fetchReadingListPages(titles, { signal: controller.signal, lang: 'en' })
      const found: Record<string, ArticleSummary> = {}
      pages.forEach((page, index) => {
        if (page.kind !== 'page') return
        found[titles[index]] = {
          thumbnailUrl: page.thumbnailUrl ?? undefined,
          description: page.description || undefined,
        }
      })
      summaries.value = found
    } catch (err) {
      if (!controller.signal.aborted) console.error(err)
    }
  })
  onBeforeUnmount(() => controller.abort())

  return summaries
}

/** Just the thumbnails, by title. */
export function useArticleThumbnails(titles: readonly string[]) {
  const summaries = useArticleSummaries(titles)
  return computed(() => {
    const thumbnails: Record<string, string> = {}
    for (const [title, summary] of Object.entries(summaries.value)) {
      if (summary.thumbnailUrl) thumbnails[title] = summary.thumbnailUrl
    }
    return thumbnails
  })
}
