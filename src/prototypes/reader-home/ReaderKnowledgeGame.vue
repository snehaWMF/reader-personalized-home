<script setup lang="ts">
/**
 * "Challenge your knowledge": "Which came first?" — two articles as standard
 * article cards (square picture, title and a date-free description), each with
 * a Select button. Picking one reveals both dates ("Discovered 1781") and
 * whether the pick was right, and turns both cards into links to their
 * articles (no links before, so the answer isn't a click away); "Next
 * question" moves on.
 *
 * The rounds are hand-picked for the reader's interests and saved pages
 * (`loadKnowledgeRounds`); each says which it came from. With none for them,
 * the general-history rounds play instead.
 * Like Suggested reads, its menu's "Customize" picks what it draws on
 * (`knowledgeGameChoices`): interests and saved articles (on by default), and
 * randomly selected rounds — the general-history sample rounds
 * (`KNOWLEDGE_GAME_ROUNDS`), one after each of the others when on beside them,
 * all of them with nothing else to draw on. Random is on by default only while
 * interests are skipped.
 */
import { computed, ref, watch } from 'vue'
import { CdxButton, CdxCard, CdxIcon, CdxMessage } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconDie, cdxIconLink } from '@wikimedia/codex-icons'

import { useWikiPrototypeNavigation } from '@/composables/useWikiPrototypeNavigation'

import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { useModuleLoad } from '../template-home/useModuleLoad'
import { type GameRound, loadKnowledgeRounds } from './loadKnowledgeRounds'
import { KNOWLEDGE_GAME_ROUNDS } from './moreModulesContent'
import ReaderCustomizeDialog, { type CustomizeSource } from './ReaderCustomizeDialog.vue'
import { type DailyImagesSource, knowledgeGameChoices, personalized } from './readerFlowState'
import { READER_ARTICLE_PATH } from './readerHomeContent'
import { useArticleThumbnails } from './useArticleThumbnails'
import { useDailyReadsSeeds } from './useReaderModules'

type Side = 'a' | 'b'

const RANDOM_REASON = 'Randomly selected'
/** Seeds looked through for rounds, at most: each costs two lookups. */
const MAX_SEEDS = 6

const { interestSeeds, savedSeeds } = useDailyReadsSeeds()
const { navigateToWikiPrototype, resolveWikiPrototypeUrl } = useWikiPrototypeNavigation()

/* ---- Sources: what's available, what's on by default, what the reader chose ---- */

const available = computed<Record<DailyImagesSource, boolean>>(() => ({
  interests: interestSeeds.value.length > 0,
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
  return available.value[source] && (knowledgeGameChoices.value[source] ?? defaults.value[source])
}

const ownSeeds = computed(() =>
  [...(isOn('interests') ? interestSeeds.value : []), ...(isOn('saved') ? savedSeeds.value : [])].slice(0, MAX_SEEDS),
)

/* ---- Rounds ---- */

/* The general-history sample rounds, as random ones; their pictures load live. */
const sampleThumbnails = useArticleThumbnails(
  KNOWLEDGE_GAME_ROUNDS.flatMap((round) => [round.a.article, round.b.article]),
)
const randomRounds = computed<GameRound[]>(() =>
  KNOWLEDGE_GAME_ROUNDS.map((round) => {
    const option = (side: Side) => ({
      ...round[side],
      thumbnailUrl: sampleThumbnails.value[round[side].article],
      sortYear: 0,
    })
    return { a: option('a'), b: option('b'), first: round.first, reason: RANDOM_REASON }
  }),
)

const { items: ownRounds, loading, error, reload } = useModuleLoad<GameRound>(
  () => ownSeeds.value.map((seed) => seed.title).join('|'),
  (signal) => loadKnowledgeRounds(ownSeeds.value, signal),
)

/**
 * Own rounds, a random one after each when random's on. With no own rounds —
 * nothing to draw on, or no questions for these interests — the general ones.
 */
const rounds = computed<GameRound[]>(() => {
  if (!ownRounds.value.length) return randomRounds.value
  if (!isOn('random')) return ownRounds.value
  return ownRounds.value.flatMap((own, index) => {
    const random = randomRounds.value[index]
    return random ? [own, random] : [own]
  })
})

const roundIndex = ref(0)
const picked = ref<Side | null>(null)

/* A different set of rounds starts over; pictures arriving for the same rounds don't. */
watch(
  () => rounds.value.map((r) => `${r.a.article}|${r.b.article}`).join('\n'),
  () => {
    roundIndex.value = 0
    picked.value = null
  },
)

const round = computed(() => rounds.value[roundIndex.value % Math.max(rounds.value.length, 1)])
const options = computed(() => (round.value ? (['a', 'b'] as const).map((side) => ({ side, ...round.value[side] })) : []))
/** "Which came first?" and the round's source, under the heading: shown once a round is. */
const hasSubheading = computed(() => !error.value && !loading.value && !!round.value)
const firstOption = computed(() => round.value?.[round.value.first])
const correct = computed(() => picked.value === round.value?.first)

/** Once answered, a card opens its article; modified clicks still open a new tab. */
function onCardClick(event: MouseEvent, article: string): void {
  if (!picked.value || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateToWikiPrototype(READER_ARTICLE_PATH, article)
}

function next(): void {
  roundIndex.value = (roundIndex.value + 1) % rounds.value.length
  picked.value = null
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
    description: 'Questions about topics you chose.',
    unavailable: 'Select interests to get these.',
  },
  {
    value: 'saved',
    label: 'Related to articles you saved',
    description: 'Questions about articles like the ones in your saved lists.',
  },
  {
    value: 'random',
    label: 'Randomly selected',
    description: 'Questions from across history.',
  },
]

const sources = computed(() => SOURCES.map((source) => ({ ...source, available: available.value[source.value] })))
const selected = computed(() => SOURCES.map((source) => source.value).filter(isOn))
const dialogOpen = ref(false)

function onMenuSelect(value: string | number): void {
  if (value === 'customize') dialogOpen.value = true
}

function save(ticked: DailyImagesSource[]): void {
  knowledgeGameChoices.value = Object.fromEntries(
    sources.value.filter((source) => source.available).map((source) => [source.value, ticked.includes(source.value)]),
  )
}
</script>

<template>
  <HomeSectionFrame id="knowledge-game" title="Challenge your knowledge">
    <!-- The menu sits on the sub heading's row once there is one; on the heading's until then. -->
    <template v-if="!hasSubheading" #actions>
      <HomeModuleMenu :menu="MENU" @select="onMenuSelect" />
    </template>

    <div class="reader-game">
      <div v-if="error" class="reader-game__note">
        <p>Couldn't load this section.</p>
        <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
      </div>

      <div v-else-if="loading" class="home-article-cards reader-game__options" aria-busy="true">
        <div v-for="index in 2" :key="index" class="home-card-skeleton" aria-hidden="true">
          <div class="home-card-skeleton__image" />
        </div>
      </div>

      <p v-else-if="!round" class="reader-game__note">No questions right now. Try other sources from the menu.</p>

      <template v-else>
        <div class="reader-game__subheading">
          <p class="reader-game__question">
            <span>Which came first?</span>
            <span class="reader-game__reason">
              <CdxIcon :icon="round.reason === RANDOM_REASON ? cdxIconDie : cdxIconLink" size="small" />
              {{ round.reason }}
            </span>
          </p>
          <HomeModuleMenu :menu="MENU" @select="onMenuSelect" />
        </div>

        <!-- `home-article-cards`: laid out like every other module's cards (two to a row on wide Vector). -->
        <div class="home-article-cards reader-game__options">
          <CdxCard
            v-for="option in options"
            :key="option.article"
            class="reader-game__option"
            :class="{
              'reader-game__option--first': picked && option.side === round.first,
              'reader-game__option--picked': picked === option.side,
            }"
            :url="picked ? (resolveWikiPrototypeUrl(READER_ARTICLE_PATH, option.article) ?? undefined) : undefined"
            :thumbnail="option.thumbnailUrl ? { url: option.thumbnailUrl } : null"
            thumbnail-size="large"
            force-thumbnail
            @click="onCardClick($event, option.article)"
          >
            <template #title>{{ option.article }}</template>
            <template v-if="option.description" #description>{{ option.description }}</template>
            <template #supporting-text>
              <span v-if="picked" class="reader-game__year">
                {{ option.label ? `${option.label} ${option.year}` : option.year }}
              </span>
              <CdxButton v-else @click.stop.prevent="picked = option.side">Select</CdxButton>
            </template>
          </CdxCard>
        </div>

        <template v-if="picked && firstOption">
          <CdxMessage :type="correct ? 'success' : 'warning'" class="reader-game__result">
            {{ correct ? 'Correct!' : 'Not quite.' }}
            {{ firstOption.article }} came first ({{ firstOption.year }}).
          </CdxMessage>
          <CdxButton v-if="rounds.length > 1" weight="quiet" action="progressive" @click="next">
            Next question
          </CdxButton>
        </template>
      </template>
    </div>
  </HomeSectionFrame>

  <ReaderCustomizeDialog
    v-model:open="dialogOpen"
    title="Customize Challenge your knowledge"
    subtitle="Choose what your questions are about."
    :sources="sources"
    :selected="selected"
    @save="save"
  />
</template>

<style scoped>
.reader-game {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-75);
}

/* The sub heading's row: the question, and the module's menu at its end. */
.reader-game__subheading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-50);
  align-self: stretch;
}

/* The question, then — in small subtle text — which source the round came from. */
.reader-game__question {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50) var(--spacing-75);
  margin: 0;
  color: var(--color-subtle);
}

/* Codex Body small, subtle, after an icon (as the Home's other "why it's here" lines). */
.reader-game__reason {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
}

.reader-game__reason .cdx-icon {
  color: inherit;
}

.reader-game__options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  align-self: stretch;
}

/* CODEX+ CdxCard: no option to pin the supporting text to the bottom (see `HomeArticleCards`). */
.reader-game__option :deep(.cdx-card__text) {
  flex-grow: 1;
  align-self: stretch;
}

.reader-game__option :deep(.cdx-card__text__supporting-text) {
  margin-top: auto;
  padding-top: var(--spacing-50);
}

/* Revealed: the one that came first in success green, a wrong pick in subtle grey. */
.reader-game__option--first {
  border-color: var(--border-color-success);
  background-color: var(--background-color-success-subtle);
}

.reader-game__option--picked:not(.reader-game__option--first) {
  background-color: var(--background-color-interactive-subtle);
}

/* Codex Body bold: the date answers the question. */
.reader-game__year {
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
  color: var(--color-base);
}

.reader-game__result {
  align-self: stretch;
}

.reader-game__note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  margin: 0;
  color: var(--color-subtle);
}

.reader-game__note p {
  margin: 0;
}
</style>
