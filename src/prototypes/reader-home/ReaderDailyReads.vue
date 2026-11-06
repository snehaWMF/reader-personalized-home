<script setup lang="ts">
/**
 * "Suggested reads": four articles a day, every concept's, drawn from up to four
 * sources the reader can switch on and off from the module's menu
 * ("Customize Daily reads", `dailyReadsChoices`):
 *
 * - Today's featured article, first. On by default when there's nothing to
 *   grow from. Not offered with `noFeatured` (the Home, whose Community
 *   curated module has it).
 * - Articles related to the reader's interests (personalized only) and to the
 *   pages they saved — seeds picked at random each day (`useDailyReadsSeeds`),
 *   each card saying which it came from. On by default when available.
 *   With interests on, one is an article created recently on one of them
 *   (`NEWLY_CREATED_FOR_INTEREST`): "… · Newly created".

 * - Randomly selected articles: one card when switched on beside the others,
 *   and every card left when there's nothing else to draw on. Off by default
 *   once interests are picked; on while they're skipped.
 */
import { computed, ref } from 'vue'
import { cdxIconConfigure, cdxIconLink, cdxIconStar } from '@wikimedia/codex-icons'


import { fetchFeed } from '../template-app-home/fetchFeed'
import type { HomeArticleCard } from '../template-home/HomeArticleCards.vue'
import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { fetchReadingListPages } from '../template-saved-pages/fetchReadingListPages'
import { loadRandomReads, loadRelatedReads } from './loadRelatedReads'
import { dailyReadsChoices, type DailyReadsSource, personalized, readerInterests } from './readerFlowState'
import { NEWLY_CREATED_FOR_INTEREST } from './readerHomeContent'
import ReaderCardList from './ReaderCardList.vue'
import ReaderCustomizeDialog, { type CustomizeSource } from './ReaderCustomizeDialog.vue'
import { DAILY_READS_COUNT, useDailyReadsSeeds } from './useReaderModules'

const props = defineProps<{ noFeatured?: boolean }>()

const { interestSeeds, savedSeeds } = useDailyReadsSeeds()

/* ---- Sources: what's available, what's on by default, what the reader chose ---- */

const available = computed<Record<DailyReadsSource, boolean>>(() => ({
  featured: !props.noFeatured,
  interests: interestSeeds.value.length > 0,
  // Always offered: with nothing saved yet it just adds no cards, until they save some.
  saved: true,
  random: true,
}))

const defaults = computed<Record<DailyReadsSource, boolean>>(() => ({
  featured: !interestSeeds.value.length && !savedSeeds.value.length,
  interests: true,
  saved: true,
  // Interests skipped: random on, as it's what fills the cards.
  random: !personalized.value,
}))

function isOn(source: DailyReadsSource): boolean {
  return available.value[source] && (dailyReadsChoices.value[source] ?? defaults.value[source])
}

const withFeatured = computed(() => isOn('featured'))
const seeds = computed(() => [
  ...(isOn('interests') ? interestSeeds.value : []),
  ...(isOn('saved') ? savedSeeds.value : []),
])

/** A new article on one of the reader's interests, while Daily reads draws on them. */
const newlyCreated = computed(() => {
  if (!isOn('interests')) return null
  const interest = readerInterests.value.find((option) => NEWLY_CREATED_FOR_INTEREST[option.id])
  return interest ? { title: NEWLY_CREATED_FOR_INTEREST[interest.id], interest: interest.name } : null
})

/**
 * Cards after the featured one: random fills them all with nothing else to
 * draw on, else one when on; the new article takes one of the related ones.
 */
const slots = computed(() => {
  const rest = DAILY_READS_COUNT - (withFeatured.value ? 1 : 0)
  const random = !seeds.value.length ? rest : isOn('random') ? 1 : 0
  const fresh = newlyCreated.value && rest - random > 0 ? 1 : 0
  return { related: rest - random - fresh, random, fresh }
})

const sourceKey = computed(() =>
  [
    withFeatured.value ? 'featured' : '',
    slots.value.related,
    slots.value.random,
    slots.value.fresh ? newlyCreated.value?.title : '',
    ...seeds.value.map((seed) => seed.title),
  ].join('|'),
)

/* ---- Loading ---- */

/** Today's featured article as a card, or none if the feed has none. */
async function loadFeatured(signal: AbortSignal): Promise<HomeArticleCard[]> {
  const { tfa } = await fetchFeed({ signal })
  if (!tfa) return []
  return [
    {
      title: tfa.displayTitle,
      description: tfa.description || undefined,
      thumbnailUrl: tfa.thumbnailUrl ?? undefined,
      supportingText: 'Today’s featured article',
      supportingIcon: cdxIconStar,
    },
  ]
}

/** The new article on one of the reader's interests, with its description and picture. */
async function loadNewlyCreated(signal: AbortSignal): Promise<HomeArticleCard[]> {
  const fresh = newlyCreated.value
  if (!fresh) return []
  const [page] = await fetchReadingListPages([fresh.title], { signal, lang: 'en' })
  return [
    {
      title: fresh.title,
      description: page?.kind === 'page' ? page.description || undefined : undefined,
      thumbnailUrl: page?.kind === 'page' ? (page.thumbnailUrl ?? undefined) : undefined,
      supportingText: `Related to ${fresh.interest} · Newly created`,
    },
  ]
}

/** One source failing shouldn't cost the others. */
function orNothing(load: Promise<HomeArticleCard[]>, signal: AbortSignal): Promise<HomeArticleCard[]> {
  return load.catch((error: unknown) => {
    if (signal.aborted) throw error
    return []
  })
}

async function load(signal: AbortSignal): Promise<HomeArticleCard[]> {
  const { related, random, fresh } = slots.value
  const groups = await Promise.all([
    withFeatured.value ? orNothing(loadFeatured(signal), signal) : [],
    fresh ? orNothing(loadNewlyCreated(signal), signal) : [],
    related ? loadRelatedReads('daily-reads', seeds.value, related, signal) : [],
    random ? orNothing(loadRandomReads(random, signal), signal) : [],
  ])
  const seen = new Set<string>()
  return groups.flat().filter((card) => !seen.has(card.title) && seen.add(card.title))
}

/* ---- "Customize Daily reads" ---- */

const MENU = {
  items: [{ value: 'customize', label: 'Customize', icon: cdxIconConfigure }],
  footer: { value: 'about', label: 'About recommendations' },
}

const ALL_SOURCES: Omit<CustomizeSource<DailyReadsSource>, 'available'>[] = [
  {
    value: 'featured',
    label: 'Today’s featured article',
    description: 'The article Wikipedia editors picked for today.',
  },
  {
    value: 'interests',
    label: 'Related to your interests',
    description: 'Articles about topics you chose.',
    unavailable: 'Select interests to get these.',
  },
  {
    value: 'saved',
    label: 'Related to articles you saved',
    description: 'Articles like the ones in your saved lists.',
  },
  {
    value: 'random',
    label: 'Randomly selected',
    description: 'A surprise from a familiar topic.',
  },
]

/** The dialog's options: the featured article only where Daily reads offers it. */
const sources = computed(() =>
  ALL_SOURCES.filter((source) => source.value !== 'featured' || !props.noFeatured).map((source) => ({
    ...source,
    available: available.value[source.value],
  })),
)
const selected = computed(() => sources.value.map((source) => source.value).filter(isOn))

const dialogOpen = ref(false)

function onMenuSelect(value: string | number): void {
  if (value === 'customize') dialogOpen.value = true
}

function save(ticked: DailyReadsSource[]): void {
  dailyReadsChoices.value = Object.fromEntries(
    sources.value.filter((source) => source.available).map((source) => [source.value, ticked.includes(source.value)]),
  )
}
</script>

<template>
  <HomeSectionFrame id="daily-reads" title="Suggested reads">
    <template #actions>
      <HomeModuleMenu :menu="MENU" @select="onMenuSelect" />
    </template>
    <ReaderCardList
      :load="load"
      :source-key="sourceKey"
      :count="DAILY_READS_COUNT"
      :supporting-icon="cdxIconLink"
    />
  </HomeSectionFrame>

  <ReaderCustomizeDialog
    v-model:open="dialogOpen"
    title="Customize Suggested reads"
    subtitle="Choose what your four daily articles are based on."
    :sources="sources"
    :selected="selected"
    @save="save"
  />
</template>
