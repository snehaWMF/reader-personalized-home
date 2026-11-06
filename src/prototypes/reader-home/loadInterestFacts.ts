/**
 * Short "Did you know…" facts picked for the reader: real hooks that ran in
 * Wikipedia's Did you know on the Main Page, from articles like each seed.
 *
 * For each seed: articles like it (CirrusSearch `morelike:`) and the seed itself;
 * of those, the ones whose talk page records a Did you know run (`{{DYK talk}}`,
 * or `dykentry` in `{{Article history}}`); then the hook from that template,
 * as plain text. Seeds' facts are interleaved so the module mixes them. Only
 * ever the seeds' own: a seed with no hooks adds none. Cached per day.
 */

import { wikimediaApiFetchHeaders } from '@/config'

import { readDayCache, utcDayKey, writeDayCache } from '../template-home/homeCache'
import { fetchMorelike, type MorelikeHit } from '../template-home/loadDailyReads'
import { titleKey } from '../template-home/useHomeSeeds'
import type { RelatedSeed } from './loadRelatedReads'

export interface InterestFact {
  /** The hook, as it ran: "… that …?" */
  text: string
  /** The article it's about (its bold link). */
  article: string
  thumbnailUrl?: string
  /** Why it's here, e.g. "Related to Arctic animals". */
  reason: string
}

const API = 'https://en.wikipedia.org/w/api.php'
/** Articles like each seed to look through: enough that most seeds turn up a hook or two. */
const CANDIDATES_PER_SEED = 40

async function actionQuery<T>(params: Record<string, string>, signal: AbortSignal): Promise<T> {
  const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params })
  // POST: a batch of 50 titles is too long for a URL. CORS's `origin` has to be in the URL itself.
  const response = await fetch(`${API}?origin=*`, {
    method: 'POST',
    body: query,
    signal,
    headers: wikimediaApiFetchHeaders('reader-home-facts'),
  })
  if (!response.ok) throw new Error(`Failed to load facts (HTTP ${response.status}).`)
  return (await response.json()) as T
}

interface TemplatePage {
  title: string
  templates?: { title: string }[]
  revisions?: { slots?: { main?: { content?: string } } }[]
}

/** Of these articles, those whose talk page records a Did you know run. */
async function articlesThatRanInDyk(titles: string[], signal: AbortSignal): Promise<string[]> {
  const data = await actionQuery<{ query?: { pages?: TemplatePage[] } }>(
    {
      titles: titles.map((title) => `Talk:${title}`).join('|'),
      prop: 'templates',
      tltemplates: 'Template:DYK talk|Template:Article history',
      tllimit: 'max',
    },
    signal,
  )
  return (data.query?.pages ?? [])
    .filter((page) => page.templates?.length)
    .map((page) => page.title.replace(/^Talk:/, ''))
}

/** Each talk page's hook, by article. */
async function hooks(titles: string[], signal: AbortSignal): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  if (!titles.length) return found
  const data = await actionQuery<{ query?: { pages?: TemplatePage[] } }>(
    {
      titles: titles.map((title) => `Talk:${title}`).join('|'),
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
    },
    signal,
  )
  for (const page of data.query?.pages ?? []) {
    const content = page.revisions?.[0]?.slots?.main?.content ?? ''
    const raw =
      // `{{DYK talk}}`, also written `{{dyktalk}}`.
      content.match(/\{\{\s*dyk\s*talk[^}]*?\|\s*entry\s*=\s*([^\n]+)/i)?.[1] ??
      content.match(/\|\s*dykentry\s*=\s*([^\n]+)/i)?.[1]
    const text = raw ? plainHook(raw) : null
    if (text) found.set(page.title.replace(/^Talk:/, ''), text)
  }
  return found
}

/**
 * The hook's wikitext as plain text, or null if it can't be read cleanly
 * (templates left in it, or not a "… that …?" hook).
 */
function plainHook(wikitext: string): string | null {
  let text = wikitext
    // The template's next parameter, if it shares the line.
    .replace(/\s*\|\s*\w+\s*=.*$/, '')
    .replace(/\}\}\s*$/, '')
    .replace(/<!--.*?-->/g, '')
    .replace(/<ref[^>]*\/>|<ref[^>]*>.*?<\/ref>/g, '')
    .replace(/\{\{\s*(?:nowrap|nobr|lang\|[^|}]+)\s*\|([^}]*)\}\}/gi, '$1')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    // "(pictured)", "(Eta Carinae pictured)": the Main Page's picture isn't here.
    .replace(/\s*\([^)]*\b(?:pictured|illustrated|shown)\)/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (/[{}[\]<>|]/.test(text)) return null
  text = text.replace(/^(\.\.\.|…)\s*/, '')
  if (!/^that\s/i.test(text) || !text.endsWith('?')) return null
  return `…${text}`
}

/** Seeds' lists interleaved — the first of each, then the second of each… */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  for (let round = 0; lists.some((list) => list.length > round); round++) {
    lists.forEach((list) => list[round] && out.push(list[round]))
  }
  return out
}

export async function loadInterestFacts(
  seeds: readonly RelatedSeed[],
  count: number,
  signal: AbortSignal,
): Promise<InterestFact[]> {
  const slot = 'reader-interest-facts-v2'
  const cacheKey = `${utcDayKey()}|${count}|${seeds.map((seed) => titleKey(seed.title)).join('|')}`
  const cached = readDayCache<InterestFact>(slot, cacheKey)
  if (cached) return cached

  const perSeed: InterestFact[][] = []
  for (const seed of seeds) {
    try {
      const hits: MorelikeHit[] = await fetchMorelike(seed.title, CANDIDATES_PER_SEED, signal)
      const titles = [seed.title, ...hits.map((hit) => hit.title)].slice(0, 50)
      const ran = await articlesThatRanInDyk(titles, signal)
      const found = await hooks(ran.slice(0, 20), signal)
      const thumbs = new Map(hits.map((hit) => [hit.title, hit.thumbnailUrl]))
      perSeed.push(
        [...found].map(([article, text]) => ({
          text,
          article,
          thumbnailUrl: thumbs.get(article),
          reason: seed.reason,
        })),
      )
    } catch (error) {
      // One seed failing shouldn't cost the others.
      if (signal.aborted) throw error
      perSeed.push([])
    }
  }

  const seen = new Set<string>()
  const facts = interleave(perSeed).filter((fact) => !seen.has(fact.article) && seen.add(fact.article))

  const picked = facts.slice(0, count)
  writeDayCache(slot, cacheKey, picked)
  return picked
}
