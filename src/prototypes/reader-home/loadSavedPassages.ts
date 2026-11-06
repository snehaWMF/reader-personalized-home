/**
 * A passage from a section of an article: the plain text of the article
 * (Action API `prop=extracts`), split at its headings, one section past the
 * lead picked at random each day, and its first couple of sentences. For
 * "Inside your saved articles" (`ReaderRediscover`).
 */

import { wikimediaApiFetchHeaders } from '@/config'

import { readDayCache, utcDayKey, writeDayCache } from '../template-home/homeCache'

export interface SectionPassage {
  section: string
  passage: string
}

/** Back-matter and lists, not prose to read. */
const SKIPPED_SECTIONS =
  /^(see also|references|notes|external links|further reading|bibliography|sources|citations|gallery|footnotes|works cited|explanatory notes|in popular culture)$/i

/** Long enough to be worth reading; short enough for a card. */
const MIN_LENGTH = 120
const MAX_LENGTH = 300

/** Same number for the same text, so a day's pick is stable. */
function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0
  return Math.abs(value)
}

/** Up to `MAX_LENGTH`, ending on a full sentence where one fits. */
function excerpt(paragraph: string): string {
  // Sentence ends: . ! or ? then a space and a capital — so "13.5" or "c. 1900" don't split.
  const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z“"(])/)
  let text = ''
  for (const sentence of sentences) {
    if (text && text.length + sentence.length + 1 > MAX_LENGTH) break
    text = text ? `${text} ${sentence}` : sentence
  }
  text = text.trim()
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…` : text
}

async function fetchPlainText(title: string, signal: AbortSignal): Promise<string> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    explaintext: '1',
    exsectionformat: 'wiki',
    redirects: '1',
    titles: title,
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    signal,
    headers: wikimediaApiFetchHeaders('reader-home-rediscover'),
  })
  if (!response.ok) throw new Error(`Failed to load ${title} (HTTP ${response.status}).`)
  const data = (await response.json()) as { query?: { pages?: Array<{ extract?: string }> } }
  return data.query?.pages?.[0]?.extract ?? ''
}

/**
 * Today's passage from `title` — from the section named `section` if it has
 * prose — or `null` if no section has prose to show.
 */
export async function loadSectionPassage(
  title: string,
  signal: AbortSignal,
  section?: string,
): Promise<SectionPassage | null> {
  const slot = `reader-saved-passage-v3-${title}${section ? `#${section}` : ''}`
  const cacheKey = utcDayKey()
  const cached = readDayCache<SectionPassage>(slot, cacheKey)
  if (cached) return cached[0] ?? null

  const text = await fetchPlainText(title, signal)
  // "== Heading ==" lines (any level) split the text; the part before the first is the lead.
  const parts = text.split(/^(={2,})\s*(.+?)\s*\1\s*$/m)
  const candidates: SectionPassage[] = []
  for (let i = 1; i + 2 < parts.length; i += 3) {
    const section = parts[i + 1]
    const body = parts[i + 2] ?? ''
    if (!section || SKIPPED_SECTIONS.test(section)) continue
    const paragraph = body
      .split(/\n+/)
      .map((line) => line.trim())
      .find((line) => line.length >= MIN_LENGTH)
    if (paragraph) candidates.push({ section, passage: excerpt(paragraph) })
  }

  const named = section && candidates.find((candidate) => candidate.section === section)
  const picked = named || (candidates.length ? candidates[hash(`${title}|${cacheKey}`) % candidates.length] : null)
  writeDayCache(slot, cacheKey, picked ? [picked] : [])
  return picked
}
