<script setup lang="ts">
/**
 * "Inside your saved articles": up to four saved articles (`sampleSaves.ts`),
 * each a card with a passage from one of its sections — "Article › Section",
 * the passage, then when they saved it and the collection it's in. A title
 * opens the article at its section (`?section=`, `article/`). Then a link to
 * their saved articles.
 *
 * Which four: sample saves from a week to a month ago — one with a section
 * added since it was saved first, with a "New section added" chip; the rest in
 * a different order each day.
 *
 * Per Codex's Card guidance, a card with links inside can't be a link itself:
 * so the card has no `url` and its title is the link to the article.
 */
import { computed } from 'vue'
import { CdxButton, CdxCard, CdxIcon, CdxInfoChip } from '@wikimedia/codex'
import { cdxIconArticleAdd, cdxIconBookmark, cdxIconNext } from '@wikimedia/codex-icons'

import { useWikiPrototypeNavigation } from '@/composables/useWikiPrototypeNavigation'

import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { useModuleLoad } from '../template-home/useModuleLoad'
import { fetchReadingListPages } from '../template-saved-pages/fetchReadingListPages'
import { loadSectionPassage } from './loadSavedPassages'
import { utcDayKey } from '../template-home/homeCache'
import { sampleSaves, savedAgo } from './sampleSaves'
import { READER_ARTICLE_PATH } from './readerHomeContent'

const COUNT = 4

interface RediscoverCard {
  article: string
  /** The section the title opens the article at (`?section=`). */
  section?: string
  heading: string
  text: string
  savedDaysAgo: number
  collection?: string
  newSection?: boolean
  thumbnailUrl?: string
}

/** Sample saves old enough to rediscover: saved a week to a month ago. */
const WINDOW_DAYS = { min: 7, max: 30 }

const { navigateToWikiPrototype, resolveWikiPrototypeUrl } = useWikiPrototypeNavigation()

/**
 * Samples in the window — the one with a new section first, the rest in a
 * different order each day. A couple more than the cards, in case one has no
 * passage to show.
 */
const picks = computed(() => {
  const inWindow = sampleSaves.value.filter(
    (save) => save.savedDaysAgo >= WINDOW_DAYS.min && save.savedDaysAgo <= WINDOW_DAYS.max,
  )
  const day = utcDayKey()
  const order = (title: string) => [...`${title}${day}`].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) | 0, 0)
  return [
    ...inWindow.filter((save) => save.newSection),
    ...inWindow.filter((save) => !save.newSection).sort((a, b) => order(a.article) - order(b.article)),
  ].slice(0, COUNT + 2)
})

const { items, loading, error, reload } = useModuleLoad<RediscoverCard>(
  () => picks.value.map((save) => save.article).join('|'),
  async (signal) => {
    if (!picks.value.length) return []
    const pages = await fetchReadingListPages(
      picks.value.map((save) => save.article),
      { signal, lang: 'en' },
    ).catch(() => [])
    const cards: RediscoverCard[] = []
    for (const [index, save] of picks.value.entries()) {
      if (cards.length >= COUNT) break
      const found = await loadSectionPassage(save.article, signal, save.newSection).catch(() => null)
      if (!found) continue
      const page = pages[index]
      cards.push({
        article: save.article,
        savedDaysAgo: save.savedDaysAgo,
        collection: save.collection,
        newSection: !!save.newSection,
        section: found.section,
        heading: `${save.article} › ${found.section}`,
        text: found.passage,
        thumbnailUrl: page?.kind === 'page' ? (page.thumbnailUrl ?? undefined) : undefined,
      })
    }
    return cards
  },
)

/** The article opens at the card's section. */
function sectionQuery(card: RediscoverCard) {
  return card.section ? { section: card.section } : undefined
}

function onTitleClick(event: MouseEvent, card: RediscoverCard): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateToWikiPrototype(READER_ARTICLE_PATH, card.article, sectionQuery(card))
}
</script>

<template>
  <HomeSectionFrame v-if="picks.length" id="rediscover" title="Inside your saved articles">
    <div class="reader-rediscover">
      <div v-if="error" class="reader-rediscover__note">
        <p>Couldn't load this section.</p>
        <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
      </div>

      <!-- `home-article-cards`: laid out like every other module's cards (two to a row on wide Vector). -->
      <div v-else-if="loading" class="home-article-cards" aria-busy="true">
        <div v-for="index in Math.min(COUNT, picks.length)" :key="index" class="home-card-skeleton" aria-hidden="true">
          <div class="home-card-skeleton__image" />
        </div>
      </div>

      <div v-else class="home-article-cards reader-rediscover__cards">
        <CdxCard
          v-for="card in items"
          :key="card.article"
          class="reader-rediscover__card"
          :thumbnail="card.thumbnailUrl ? { url: card.thumbnailUrl } : null"
          thumbnail-size="large"
          force-thumbnail
        >
          <template #title>
            <span v-if="card.newSection" class="reader-rediscover__chip">
              <CdxInfoChip status="subtle" :icon="cdxIconArticleAdd">New section added</CdxInfoChip>
            </span>
            <a
              class="reader-rediscover__title"
              :href="resolveWikiPrototypeUrl(READER_ARTICLE_PATH, card.article, sectionQuery(card)) ?? undefined"
              @click="onTitleClick($event, card)"
            >
              {{ card.heading }}
            </a>
          </template>
          <template #description>
            <span class="reader-rediscover__passage">{{ card.text }}</span>
          </template>
          <template #supporting-text>
            <span class="reader-rediscover__meta">
              <CdxIcon :icon="cdxIconBookmark" size="small" />
              <span>{{ savedAgo(card.savedDaysAgo) }}</span>
              <template v-if="card.collection">
                <span aria-hidden="true">·</span>
                <!-- Plain text for now: there's no collection page in the prototype yet. -->
                <span>In {{ card.collection }}</span>
              </template>
            </span>
          </template>
        </CdxCard>
      </div>

      <!-- Looks like a link, but goes nowhere in the prototype yet. -->
      <span class="reader-rediscover__more">
        Go to your saved articles
        <CdxIcon :icon="cdxIconNext" size="small" />
      </span>
    </div>
  </HomeSectionFrame>
</template>

<style scoped>
.reader-rediscover {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* `HomeArticleCards`' list rule, for cards drawn here. */
.reader-rediscover__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* CODEX+ CdxCard: text centres on the thumbnail; here it starts at the top, chip first. */
.reader-rediscover__card {
  align-items: flex-start;
}

.reader-rediscover__card :deep(.cdx-card__text) {
  flex-grow: 1;
  align-self: stretch;
}

/* CODEX+ CdxCard: supporting text pinned to the bottom (as `HomeArticleCards`). */
.reader-rediscover__card :deep(.cdx-card__text__supporting-text) {
  margin-top: auto;
  padding-top: var(--spacing-50);
}

/* The card's title, as the link to the article: in the title's own colour, underlined on hover. */
.reader-rediscover__title {
  color: inherit;
  text-decoration: none;
}

.reader-rediscover__title:hover {
  text-decoration: underline;
}

/* A passage to read, not a one-line description: up to three lines. */
.reader-rediscover__passage {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.reader-rediscover__meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-25);
}

/*
 * Just an indicator, not a control: the filled bookmark (Codex's "saved" state;
 * the outline one means unsaved), greyed out in Codex's placeholder colour.
 */
.reader-rediscover__meta .cdx-icon {
  color: var(--color-placeholder);
}

/* Codex Body bold link, with a trailing chevron. */
.reader-rediscover__more {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  align-self: flex-start;
  font-weight: var(--font-weight-bold);
  color: var(--color-progressive);
  text-decoration: none;
}

.reader-rediscover__more .cdx-icon {
  color: inherit;
}

.reader-rediscover__more:hover {
  color: var(--color-progressive--hover);
  text-decoration: underline;
}

/* The chip (Codex's outlined "subtle" one) on its own line above the title. */
.reader-rediscover__chip {
  display: block;
  margin-bottom: var(--spacing-25);
  font-weight: var(--font-weight-normal);
}

.reader-rediscover__note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  color: var(--color-subtle);
}

.reader-rediscover__note p {
  margin: 0;
}
</style>
