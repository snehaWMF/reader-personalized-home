<script setup lang="ts">
/**
 * "Community curated": four of today's Main Page picks as article cards, one
 * from each section — the featured article, a story in the news, a "Did you
 * know" hook and an "On this day" event (a bright one: no deaths, disasters or
 * conflict, a discovery or opening first) — each card's text the pick's own,
 * with an info chip above it naming the section. Then a link on to the Main
 * Page for the rest. From the apps' Community feed, in one call (plus one for
 * the "Did you know" article's picture).
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconCalendar, cdxIconLightbulb, cdxIconNewspaper, cdxIconNext, cdxIconStar } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { WIKIPEDIA_MAIN_PAGE_TITLE } from '@/composables/useWordmarkMainPageLink'

import { fetchFeed } from '../template-app-home/fetchFeed'
import type { HomeArticleCard } from '../template-home/HomeArticleCards.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { fetchReadingListPages } from '../template-saved-pages/fetchReadingListPages'
import ReaderCardList from './ReaderCardList.vue'
import { READER_ARTICLE_PATH } from './readerHomeContent'

const COUNT = 4

/** On this day events to skip: deaths, disasters, conflict, crime. */
const GLOOMY =
  /\b(kill|killed|killing|dead|death|deaths|died|dies|murder|assassinat|massacre|genocide|war|battle|attack|invasion|invaded|bomb|shoot|shooting|terror|riot|crash|crashed|disaster|earthquake|flood|fire|explosion|exploded|sank|sinking|shipwreck|famine|epidemic|arrest|exile|deport|execut|abuse|feral|neglect|rebellion|coup|hostage|kidnap)/i

/** …and the kind to prefer: something found, made or begun. */
const UPBEAT =
  /\b(discover|invent|launch|opened|opening|premiere|founded|unveil|first flight|landed on|completed construction|inaugurat)/i

const route = useRoute()

const mainPageLocation = computed(() => ({
  path: READER_ARTICLE_PATH,
  query: { ...preservedQueryFromLocationQuery(route.query), title: WIKIPEDIA_MAIN_PAGE_TITLE },
}))

/** Plain text of a feed snippet. */
function textOf(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

/** The article a "Did you know" hook is about: its bold link (else its first). */
function hookArticle(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const link =
    doc.querySelector<HTMLAnchorElement>('b a[title]') ?? doc.querySelector<HTMLAnchorElement>('a[title]')
  return link?.title ?? ''
}

async function thumbnailOf(title: string, signal: AbortSignal): Promise<string | undefined> {
  try {
    const [page] = await fetchReadingListPages([title], { signal, lang: 'en' })
    return page?.kind === 'page' ? (page.thumbnailUrl ?? undefined) : undefined
  } catch (error) {
    if (signal.aborted) throw error
    return undefined
  }
}

async function load(signal: AbortSignal): Promise<HomeArticleCard[]> {
  // Every On this day event, so a bright one can be picked.
  const feed = await fetchFeed({ signal, onThisDayCount: 50 })
  // In the news and Did you know come only with the current day in UTC — a
  // day ahead of the reader's own date in the evening in the Americas. When
  // the reader's day has none, take them from the UTC day's (else yesterday's).
  if (!feed.news.length || !feed.dyk.length) {
    const offset = new Date().getTimezoneOffset() * 60_000
    const utcToday = new Date(Date.now() + offset)
    const sameDay = utcToday.toDateString() === new Date().toDateString()
    const other = await fetchFeed({ signal, date: sameDay ? new Date(Date.now() - 86_400_000) : utcToday }).catch(
      (error: unknown) => {
        if (signal.aborted) throw error
        return null
      },
    )
    if (other) {
      if (!feed.news.length) feed.news = other.news
      if (!feed.dyk.length) feed.dyk = other.dyk
    }
  }
  const cards: HomeArticleCard[] = []

  if (feed.tfa) {
    cards.push({
      title: feed.tfa.displayTitle,
      description: feed.tfa.description || undefined,
      thumbnailUrl: feed.tfa.thumbnailUrl ?? undefined,
      chip: { label: 'Today’s featured article', icon: cdxIconStar },
    })
  }

  const story = feed.news.find((item) => item.title)
  if (story) {
    cards.push({
      title: story.title,
      description: textOf(story.storyHtml),
      thumbnailUrl: story.thumbnailUrl ?? undefined,
      chip: { label: 'In the news', icon: cdxIconNewspaper },
    })
  }

  const hook = feed.dyk.find((html) => hookArticle(html))
  if (hook) {
    const title = hookArticle(hook)
    cards.push({
      title,
      description: textOf(hook),
      thumbnailUrl: await thumbnailOf(title, signal),
      chip: { label: 'Did you know', icon: cdxIconLightbulb },
    })
  }

  // A bright one: no deaths, disasters or conflict; a discovery, invention or opening first.
  const brightEvents = feed.onThisDay.filter((item) => item.pages.length && !GLOOMY.test(item.text))
  const event = brightEvents.find((item) => UPBEAT.test(item.text)) ?? brightEvents[0]
  if (event) {
    const page = event.pages.find((candidate) => candidate.thumbnailUrl) ?? event.pages[0]
    cards.push({
      title: page.displayTitle,
      description: `${event.year}: ${event.text}`,
      thumbnailUrl: page.thumbnailUrl ?? undefined,
      chip: { label: 'On this day', icon: cdxIconCalendar },
    })
  }

  return cards
}
</script>

<template>
  <HomeSectionFrame id="community-curated" title="Community curated">
    <div class="reader-community-curated">
      <ReaderCardList :load="load" :count="COUNT" />

      <RouterLink class="reader-community-curated__more" :to="mainPageLocation">
        See more on the community page
        <CdxIcon :icon="cdxIconNext" size="small" />
      </RouterLink>
    </div>
  </HomeSectionFrame>
</template>

<style scoped>
.reader-community-curated {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* Codex Body bold link, with a trailing chevron (as "See all collections"). */
.reader-community-curated__more {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  align-self: flex-start;
  font-weight: var(--font-weight-bold);
  color: var(--color-progressive);
  text-decoration: none;
}

.reader-community-curated__more .cdx-icon {
  color: inherit;
}

.reader-community-curated__more:hover {
  color: var(--color-progressive--hover);
  text-decoration: underline;
}
</style>
