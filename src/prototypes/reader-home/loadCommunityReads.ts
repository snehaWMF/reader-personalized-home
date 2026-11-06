/**
 * The reader Home's community list: the week's most-read articles (Pageviews
 * top, summed over the last seven full days), with descriptions and thumbnails.
 */

import {
  fetchReadingListPages,
  type SavedPageListItem,
} from '../template-saved-pages/fetchReadingListPages'
import type { HomeArticleCard } from '../template-home/HomeArticleCards.vue'
import { readDayCache, utcDayKey, writeDayCache } from '../template-home/homeCache'

/** Most-read articles on the Home (cards with a rank chip); its "See all" page has the full list. */
export const TOP_READS_COUNT = 4
/** Top reads loaded, and on the "See all" page. */
export const TOP_READS_PAGE_COUNT = 25
const DAYS = 7

/** "2.4M", "860K". */
const VIEWS = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Not articles: the Main Page and other namespaces that show up in Pageviews top. */
const NON_ARTICLE = /^(Main_Page|Special:|Wikipedia:|File:|Portal:|Help:|Category:|Template:|User:|Talk:)/

interface TopArticle {
  article: string
  views: number
}

async function fetchTopForDay(date: Date, signal: AbortSignal): Promise<TopArticle[]> {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '/')
  const response = await fetch(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${day}`,
    // No `Api-User-Agent`: wikimedia.org's CORS preflight doesn't allow the header.
    { signal },
  )
  if (!response.ok) throw new Error(`Failed to load top reads (HTTP ${response.status}).`)
  const data = (await response.json()) as { items?: Array<{ articles?: TopArticle[] }> }
  return data.items?.[0]?.articles ?? []
}

/** The week's most-read articles, most views first, with descriptions and thumbnails. */
export async function loadTopReads(signal: AbortSignal): Promise<HomeArticleCard[]> {
  const cacheKey = utcDayKey()
  const cached = readDayCache<HomeArticleCard>('reader-top-reads-v4', cacheKey)
  if (cached) return cached

  // Yesterday back: today's counts aren't published yet (and yesterday's may not be either).
  const days = Array.from({ length: DAYS }, (_, i) => new Date(Date.now() - (i + 1) * 86_400_000))
  const results = await Promise.allSettled(days.map((date) => fetchTopForDay(date, signal)))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  const totals = new Map<string, number>()
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const { article, views } of result.value) {
      if (NON_ARTICLE.test(article)) continue
      totals.set(article, (totals.get(article) ?? 0) + views)
    }
  }
  if (!totals.size) throw new Error('No top reads for the last week.')

  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_READS_PAGE_COUNT)
  const titles = top.map(([article]) => article.replace(/_/g, ' '))

  const pages = await fetchReadingListPages(titles, { signal, lang: 'en' })
  // Each card ranked by its place, with a green chip ("1") and its week's views.
  const cards = pages
    .map((page, index) => ({ page, views: top[index][1] }))
    .filter((entry): entry is { page: Extract<SavedPageListItem, { kind: 'page' }>; views: number } => entry.page.kind === 'page')
    .map(({ page, views }, rank) => ({
      title: page.title,
      description: page.description || undefined,
      thumbnailUrl: page.thumbnailUrl ?? undefined,
      chip: { label: String(rank + 1), status: 'success', bare: true },
      supportingText: `${VIEWS.format(views)} views this week`,
    }))

  writeDayCache('reader-top-reads-v4', cacheKey, cards)
  return cards
}
