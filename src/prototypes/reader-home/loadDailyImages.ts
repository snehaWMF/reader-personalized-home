/**
 * Images from inside articles, for "Wikipedia in pictures"
 * (`ReaderDailyImages`): from each seed's own article — and, for more, an
 * article like it — one photo with its caption, picked at random each day.
 * Not the lead image (Daily reads shows that), and only captioned photos: no
 * maps, diagrams, logos or drawings, and only landscape photos of about the
 * same shape (4∶3 to 3∶2).
 */

import { wikimediaApiFetchHeaders } from '@/config'

import { readDayCache, utcDayKey, writeDayCache } from '../template-home/homeCache'
import { fetchMorelike } from '../template-home/loadDailyReads'
import type { RelatedSeed } from './loadRelatedReads'

export interface DailyImage {
  /** `File:…` */
  file: string
  thumbUrl: string
  caption: string
  /** The article it's in. */
  article: string
  /** Why it's here, e.g. "Related to Arctic animals". */
  reason: string
  /** Width ÷ height (between `MIN_ASPECT` and `MAX_ASPECT`). */
  aspect: number
}

interface MediaItem {
  type?: string
  title?: string
  leadImage?: boolean
  showInGallery?: boolean
  caption?: { text?: string }
  srcset?: Array<{ src?: string; scale?: string }>
}

/** Photos only: no vector drawings, animations, or files named as maps, ranges, logos… */
const NOT_A_PHOTO = /\.(svg|gif|tiff?)$|\b(map|range|distribution|logo|icon|diagram|chart|graph|plate|illustration|flag|seal|coat of arms)\b/i
const MIN_CAPTION = 15
/** Width ÷ height between these: landscape photos about 4∶3 to 3∶2, so a row comes out nearly the same height. */
const MIN_ASPECT = 1.28
const MAX_ASPECT = 1.55

/** Same number for the same text, so a day's pick is stable. */
function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0
  return Math.abs(value)
}

function absolute(src: string): string {
  return src.startsWith('//') ? `https:${src}` : src
}

/** Each file's width and height, by the title as given. */
async function fetchSizes(files: string[], signal: AbortSignal): Promise<Map<string, { width: number; height: number }>> {
  const sizes = new Map<string, { width: number; height: number }>()
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50)
    const params = new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'size',
      titles: batch.join('|'),
      format: 'json',
      formatversion: '2',
      origin: '*',
    })
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      signal,
      headers: wikimediaApiFetchHeaders('reader-home-daily-images'),
    })
    if (!response.ok) continue
    const data = (await response.json()) as {
      query?: {
        normalized?: Array<{ from: string; to: string }>
        pages?: Array<{ title: string; imageinfo?: Array<{ width?: number; height?: number }> }>
      }
    }
    const toAsked = new Map((data.query?.normalized ?? []).map((entry) => [entry.to, entry.from]))
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0]
      if (info?.width && info.height) sizes.set(toAsked.get(page.title) ?? page.title, { width: info.width, height: info.height })
    }
  }
  return sizes
}

/** One captioned photo from inside `article` (not its lead), chosen by the day; or none. */
async function pickImage(article: string, day: string, signal: AbortSignal) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(article.replace(/ /g, '_'))}`,
    { signal, headers: wikimediaApiFetchHeaders('reader-home-daily-images') },
  )
  if (!response.ok) return null
  const data = (await response.json()) as { items?: MediaItem[] }
  const photos = (data.items ?? []).filter(
    (item) =>
      item.type === 'image' &&
      !item.leadImage &&
      item.title &&
      item.srcset?.[0]?.src &&
      (item.caption?.text?.trim().length ?? 0) >= MIN_CAPTION &&
      !NOT_A_PHOTO.test(item.title.replace(/_/g, ' ')),
  )
  if (!photos.length) return null

  // Not tall: their sizes, from the files themselves.
  const sizes = await fetchSizes(
    photos.map((item) => item.title as string),
    signal,
  )
  const wideEnough = photos.filter((item) => {
    const size = sizes.get(item.title as string)
    const aspect = size ? size.width / size.height : 0
    return aspect >= MIN_ASPECT && aspect <= MAX_ASPECT
  })
  if (!wideEnough.length) return null
  const photo = wideEnough[hash(`${article}|${day}`) % wideEnough.length]
  const size = sizes.get(photo.title as string) as { width: number; height: number }
  return {
    file: photo.title as string,
    aspect: size.width / size.height,
    thumbUrl: absolute(photo.srcset?.[0]?.src as string),
    // Without reference markers ("[117]", "[a]"): a caption here has no footnotes.
    caption: (photo.caption?.text as string).replace(/\[(?:\d+|[a-z]|note \d+)\]/gi, '').replace(/\s+/g, ' ').trim(),
  }
}

/**
 * Up to `count` images, one per article: from each seed's own article first
 * (seeds shuffled by the day), then from an article like each. Cached per
 * day and seed set.
 */
export async function loadDailyImages(
  seeds: readonly RelatedSeed[],
  count: number,
  signal: AbortSignal,
): Promise<DailyImage[]> {
  if (!seeds.length) return []
  const day = utcDayKey()
  const slot = 'reader-daily-images-v6'
  const cacheKey = `${day}|${count}|${seeds.map((seed) => seed.title).join('|')}`
  const cached = readDayCache<DailyImage>(slot, cacheKey)
  if (cached) return cached

  const order = [...seeds].sort((a, b) => hash(`${a.title}${day}`) - hash(`${b.title}${day}`))
  const images: DailyImage[] = []
  const used = new Set<string>()

  async function tryArticle(article: string, reason: string): Promise<void> {
    if (images.length >= count || used.has(article)) return
    used.add(article)
    const picked = await pickImage(article, day, signal).catch((error: unknown) => {
      if (signal.aborted) throw error
      return null
    })
    if (picked) images.push({ ...picked, article, reason })
  }

  // The seeds' own articles first…
  for (const seed of order) await tryArticle(seed.title, seed.reason)
  // …then, while short, an article like each.
  for (const seed of order) {
    if (images.length >= count) break
    const hits = await fetchMorelike(seed.title, 3, signal).catch(() => [])
    for (const hit of hits) {
      if (images.length >= count) break
      await tryArticle(hit.title, seed.reason)
    }
  }

  writeDayCache(slot, cacheKey, images)
  return images
}
