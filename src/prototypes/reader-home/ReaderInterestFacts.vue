<script setup lang="ts">
/**
 * "Did you know…": four short facts a day, picked for the reader — real hooks
 * from Wikipedia's Did you know, about articles like their interests and the
 * pages they saved (`loadInterestFacts`). Each card leads with the fact — the
 * hook names its article — then why it's here, with the article's small
 * picture on the right; the card opens the article. Unlike the Home's article
 * cards (picture first, title first), so facts read as facts.
 *
 * Like Daily reads and Wikipedia in pictures, its menu's "Customize" picks what
 * it draws on (`interestFactsChoices`): interests and saved articles (on by
 * default), and randomly selected topics (on by default only while interests
 * are skipped) — one fact when on beside the others, every fact with nothing
 * else to draw on. When the reader's own sources turn up no facts, random
 * ones take their place.
 */
import { computed, ref } from 'vue'
import { CdxButton, CdxCard, CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconDie, cdxIconLink } from '@wikimedia/codex-icons'

import { useWikiPrototypeNavigation } from '@/composables/useWikiPrototypeNavigation'

import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { useModuleLoad } from '../template-home/useModuleLoad'
import { type InterestFact, loadInterestFacts } from './loadInterestFacts'
import type { RelatedSeed } from './loadRelatedReads'
import ReaderCustomizeDialog, { type CustomizeSource } from './ReaderCustomizeDialog.vue'
import { type DailyImagesSource, interestFactsChoices, personalized } from './readerFlowState'
import { READER_ARTICLE_PATH, RANDOM_TOPICS } from './readerHomeContent'
import { DAILY_READS_COUNT, useDailyReadsSeeds } from './useReaderModules'

const RANDOM_REASON = 'Randomly selected'

const { interestSeeds, savedSeeds } = useDailyReadsSeeds()

/* ---- Sources: what's available, what's on by default, what the reader chose ---- */

const available = computed<Record<DailyImagesSource, boolean>>(() => ({
  interests: interestSeeds.value.length > 0,
  // Always offered: with nothing saved yet it just adds no facts, until they save some.
  saved: true,
  random: true,
}))

/** Interests picked: all but random. Skipped: saved and random. */
const defaults = computed<Record<DailyImagesSource, boolean>>(() => ({
  interests: true,
  saved: true,
  random: !personalized.value,
}))

function isOn(source: DailyImagesSource): boolean {
  return available.value[source] && (interestFactsChoices.value[source] ?? defaults.value[source])
}

const ownSeeds = computed(() => [
  ...(isOn('interests') ? interestSeeds.value : []),
  ...(isOn('saved') ? savedSeeds.value : []),
])

/* Random familiar topics: four a day, from a fixed shuffle. */
const randomSeeds = computed<RelatedSeed[]>(() => {
  const day = Math.floor(Date.now() / 86_400_000)
  return [0, 1, 2, 3].map((offset) => ({
    title: RANDOM_TOPICS[(day * 4 + offset) % RANDOM_TOPICS.length],
    reason: RANDOM_REASON,
  }))
})

/** Random fills every fact with nothing else to draw on, else one when on. */
const slots = computed(() => {
  const random = !ownSeeds.value.length ? DAILY_READS_COUNT : isOn('random') ? 1 : 0
  return { own: DAILY_READS_COUNT - random, random }
})

const sourceKey = computed(() =>
  [slots.value.own, slots.value.random, ...ownSeeds.value.map((seed) => seed.title)].join('|'),
)

/* ---- Loading ---- */

const { navigateToWikiPrototype, resolveWikiPrototypeUrl } = useWikiPrototypeNavigation()

const { items, loading, error, reload } = useModuleLoad<InterestFact>(
  () => sourceKey.value,
  async (signal) => {
    const { own, random } = slots.value
    const [mine, chance] = await Promise.all([
      own ? loadInterestFacts(ownSeeds.value, own, signal) : [],
      random ? loadInterestFacts(randomSeeds.value, random, signal) : [],
    ])
    // No facts from the reader's own sources: general ones (random familiar topics) instead.
    const general = !mine.length && !random ? await loadInterestFacts(randomSeeds.value, DAILY_READS_COUNT, signal) : chance
    const used = new Set(mine.map((fact) => fact.article))
    return [...mine, ...general.filter((fact) => !used.has(fact.article))].slice(0, DAILY_READS_COUNT)
  },
)

/** Cards open their article; modified clicks still open a new tab. */
function onClick(event: MouseEvent, fact: InterestFact): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateToWikiPrototype(READER_ARTICLE_PATH, fact.article)
}

/* ---- "Customize" ---- */

const MENU = {
  items: [{ value: 'customize', label: 'Customize', icon: cdxIconConfigure }],
  footer: { value: 'about', label: 'About recommendations' },
}

const SOURCES: Omit<CustomizeSource<DailyImagesSource>, 'available'>[] = [
  {
    value: 'interests',
    label: 'Related to your interests',
    description: 'Facts about topics you chose.',
    unavailable: 'Select interests to get these.',
  },
  {
    value: 'saved',
    label: 'Related to articles you saved',
    description: 'Facts like the articles in your saved lists.',
  },
  {
    value: 'random',
    label: 'Randomly selected',
    description: 'A surprise from a familiar topic.',
  },
]

const sources = computed(() => SOURCES.map((source) => ({ ...source, available: available.value[source.value] })))
const selected = computed(() => SOURCES.map((source) => source.value).filter(isOn))
const dialogOpen = ref(false)

function onMenuSelect(value: string | number): void {
  if (value === 'customize') dialogOpen.value = true
}

function save(ticked: DailyImagesSource[]): void {
  interestFactsChoices.value = Object.fromEntries(
    sources.value.filter((source) => source.available).map((source) => [source.value, ticked.includes(source.value)]),
  )
}
</script>

<template>
  <HomeSectionFrame id="interest-facts" title="Did you know…">
    <template #actions>
      <HomeModuleMenu :menu="MENU" @select="onMenuSelect" />
    </template>
    <div v-if="error" class="reader-facts__note">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <p v-else-if="!loading && !items.length" class="reader-facts__note">
      No facts right now. Try other sources from the menu.
    </p>

    <!-- `home-article-cards`: laid out like every other module's cards (two to a row on wide Vector). -->
    <div v-else class="home-article-cards reader-facts" :aria-busy="loading">
      <template v-if="loading">
        <div v-for="index in DAILY_READS_COUNT" :key="index" class="reader-facts__skeleton" aria-hidden="true" />
      </template>

      <CdxCard
        v-for="fact in items"
        v-else
        :key="fact.article"
        class="reader-facts__card"
        :url="resolveWikiPrototypeUrl(READER_ARTICLE_PATH, fact.article) ?? undefined"
        :thumbnail="fact.thumbnailUrl ? { url: fact.thumbnailUrl } : null"
        thumbnail-size="small"
        force-thumbnail
        @click="onClick($event, fact)"
      >
        <template #description>{{ fact.text }}</template>
        <template #supporting-text>
          <span class="reader-facts__reason">
            <span class="reader-facts__reason-icon">
              <CdxIcon :icon="fact.reason === RANDOM_REASON ? cdxIconDie : cdxIconLink" size="small" />
            </span>
            <span>{{ fact.reason }}</span>
          </span>
        </template>
      </CdxCard>
    </div>
  </HomeSectionFrame>

  <ReaderCustomizeDialog
    v-model:open="dialogOpen"
    title="Customize Did you know"
    subtitle="Choose what your four daily facts are based on."
    :sources="sources"
    :selected="selected"
    @save="save"
  />
</template>

<style scoped>
.reader-facts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/*
 * CODEX+ CdxCard: the thumbnail always comes first. Here the fact leads and
 * the small picture sits at the end, top-aligned with the text.
 */
.reader-facts__card {
  flex-direction: row-reverse;
  align-items: flex-start;
}

/* Codex spaces the thumbnail on its end side; at the card's end it needs the space before it. */
.reader-facts__card :deep(.cdx-card__thumbnail) {
  margin-inline: var(--spacing-75) 0;
}

.reader-facts__card :deep(.cdx-card__text) {
  flex-grow: 1;
  align-self: stretch;
}

/* The fact is the card's main text: Codex Body, in the base colour. */
.reader-facts__card :deep(.cdx-card__text__description) {
  color: var(--color-base);
}

/* CODEX+ CdxCard: supporting text pinned to the bottom (as `HomeArticleCards`). */
.reader-facts__card :deep(.cdx-card__text__supporting-text) {
  margin-top: auto;
  padding-top: var(--spacing-50);
}

.reader-facts__reason {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-25);
}

/* One line box tall, so the icon centres on the first line of text. */
.reader-facts__reason-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 1lh;
}

/* A card's outline, empty, while loading (as `HomeArticleCards`' skeletons). */
.reader-facts__skeleton {
  box-sizing: border-box;
  height: 104px;
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
}

.reader-facts__note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  margin: 0;
  color: var(--color-subtle);
}

.reader-facts__note p {
  margin: 0;
}
</style>
