<script setup lang="ts">
/**
 * "Wikipedia in pictures": four images a day from inside articles about
 * the reader's interests and saved pages (or, with neither, random familiar
 * topics: "Wikipedia in pictures"), shown the way articles show them — a
 * framed figure, uncropped, with its caption — and under each, in small text,
 * why it's here, after an icon (a die when random). Only landscape photos of about the same shape,
 * so the row's images come out nearly the same height. Four to a row on Vector; a row that scrolls sideways on small
 * screens.
 *
 * Like Daily reads, its menu's "Customize" picks what it draws on
 * (`dailyImagesChoices`): interests and saved articles (on by default), and
 * randomly selected topics (on by default only while interests are skipped) —
 * one image when on beside the others, every image with nothing else to draw on.
 *
 * A figure opens its article scrolled to that image (`?image=`, `article/`).
 */
import { computed, ref } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconDie, cdxIconLink } from '@wikimedia/codex-icons'

import { useWikiPrototypeNavigation } from '@/composables/useWikiPrototypeNavigation'

import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { useModuleLoad } from '../template-home/useModuleLoad'
import { type DailyImage, loadDailyImages } from './loadDailyImages'
import type { RelatedSeed } from './loadRelatedReads'
import { dailyImagesChoices, type DailyImagesSource, personalized } from './readerFlowState'
import { READER_ARTICLE_PATH, RANDOM_TOPICS } from './readerHomeContent'
import ReaderCustomizeDialog, { type CustomizeSource } from './ReaderCustomizeDialog.vue'
import { DAILY_READS_COUNT, useDailyReadsSeeds } from './useReaderModules'

const { interestSeeds, savedSeeds } = useDailyReadsSeeds()
const { navigateToWikiPrototype, resolveWikiPrototypeUrl } = useWikiPrototypeNavigation()

const RANDOM_REASON = 'Randomly selected'

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
  return available.value[source] && (dailyImagesChoices.value[source] ?? defaults.value[source])
}

const ownSeeds = computed(() => [
  ...(isOn('interests') ? interestSeeds.value : []),
  ...(isOn('saved') ? savedSeeds.value : []),
])
const title = 'Wikipedia in pictures'

/** Random familiar topics. */
const RANDOM_SEEDS: RelatedSeed[] = RANDOM_TOPICS.map((topic) => ({ title: topic, reason: RANDOM_REASON }))

/** Random fills every image with nothing else to draw on, else one when on. */
const slots = computed(() => {
  const random = !ownSeeds.value.length ? DAILY_READS_COUNT : isOn('random') ? 1 : 0
  return { own: DAILY_READS_COUNT - random, random }
})

const { items, loading, error, reload } = useModuleLoad<DailyImage>(
  () => [slots.value.own, slots.value.random, ...ownSeeds.value.map((seed) => seed.title)].join('|'),
  async (signal) => {
    const { own, random } = slots.value
    const [mine, chance] = await Promise.all([
      own ? loadDailyImages(ownSeeds.value, own, signal) : [],
      random ? loadDailyImages(RANDOM_SEEDS, random, signal) : [],
    ])
    const used = new Set(mine.map((image) => image.article))
    return [...mine, ...chance.filter((image) => !used.has(image.article))]
  },
)

/* ---- "Customize" ---- */

const MENU = {
  items: [{ value: 'customize', label: 'Customize', icon: cdxIconConfigure }],
  footer: { value: 'about', label: 'About recommendations' },
}

const SOURCES: Omit<CustomizeSource<DailyImagesSource>, 'available'>[] = [
  {
    value: 'interests',
    label: 'From your interests',
    description: 'Pictures from articles about topics you chose.',
    unavailable: 'Select interests to get these.',
  },
  {
    value: 'saved',
    label: 'From articles you saved',
    description: 'Pictures from articles in your saved lists.',
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
  dailyImagesChoices.value = Object.fromEntries(
    sources.value.filter((source) => source.available).map((source) => [source.value, ticked.includes(source.value)]),
  )
}

/** The article, scrolled to this image. */
function imageQuery(image: DailyImage) {
  return { image: image.file.replace(/^File:/, '') }
}

function onClick(event: MouseEvent, image: DailyImage): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateToWikiPrototype(READER_ARTICLE_PATH, image.article, imageQuery(image))
}
</script>

<template>
  <HomeSectionFrame id="daily-images" :title="title">
    <template #actions>
      <HomeModuleMenu :menu="MENU" @select="onMenuSelect" />
    </template>
    <div v-if="error" class="reader-daily-images__note">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <div v-else class="reader-daily-images" :aria-busy="loading">
      <template v-if="loading">
        <div v-for="index in DAILY_READS_COUNT" :key="index" class="reader-daily-images__skeleton" aria-hidden="true" />
      </template>

      <div v-for="image in items" v-else :key="image.file" class="reader-daily-images__item">
        <a
          class="reader-daily-images__link"
          :href="resolveWikiPrototypeUrl(READER_ARTICLE_PATH, image.article, imageQuery(image)) ?? undefined"
          @click="onClick($event, image)"
        >
          <figure class="reader-daily-images__figure">
            <img class="reader-daily-images__image" :src="image.thumbUrl" :alt="image.caption" loading="lazy" />
            <figcaption class="reader-daily-images__caption">{{ image.caption }}</figcaption>
          </figure>
        </a>
        <span class="reader-daily-images__reason">
          <span class="reader-daily-images__reason-icon">
            <CdxIcon :icon="image.reason === RANDOM_REASON ? cdxIconDie : cdxIconLink" size="small" />
          </span>
          <span>{{ image.reason }}</span>
        </span>
      </div>
    </div>
  </HomeSectionFrame>

  <ReaderCustomizeDialog
    v-model:open="dialogOpen"
    title="Customize these pictures"
    subtitle="Choose what your four daily pictures come from."
    :sources="sources"
    :selected="selected"
    @save="save"
  />
</template>

<style scoped>
/*
 * Small screens (Minerva, or a narrow window): one row that scrolls sideways,
 * each image most of the screen wide, so the next one peeks in.
 */
.reader-daily-images {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-75);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.reader-daily-images::-webkit-scrollbar {
  display: none;
}

.reader-daily-images > * {
  flex: 0 0 70%;
  scroll-snap-align: start;
}

/* Vector, wide enough: four to a row, no scrolling… */
@media (min-width: 768px) {
  .home-page[data-skin='desktop'] .reader-daily-images {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-100);
    overflow: visible;
  }

  /* …two beside a right column. */
  .home-page[data-skin='desktop'] .reader-with-side--split .reader-daily-images {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.reader-daily-images__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.reader-daily-images__link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.reader-daily-images__link:focus-visible {
  outline: var(--border-width-thick) var(--border-style-base) var(--border-color-progressive--focus);
  outline-offset: 1px;
}

/*
 * PROTOWIKI+ No figure component in Codex: an article's framed image
 * ("thumb") — a thin border, a little padding, the caption on the subtle
 * background below the uncropped image.
 */
.reader-daily-images__figure {
  margin: 0 0 var(--spacing-25);
  padding: var(--spacing-25);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  background-color: var(--background-color-interactive-subtle);
}

.reader-daily-images__link:hover .reader-daily-images__figure {
  border-color: var(--border-color-interactive);
}

.reader-daily-images__image {
  display: block;
  width: 100%;
  height: auto;
}

/*
 * Codex Body small, as an article's image caption. Most fit in a few lines;
 * a much longer one stops at four, with an ellipsis, so its card doesn't
 * tower over the others in the row. The image's alt text keeps it in full.
 */
.reader-daily-images__caption {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  padding: var(--spacing-25) var(--spacing-25) 0;
  margin-bottom: var(--spacing-12);
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-base);
}

/* Codex Body small, subtle: why it's here, after an icon (as Daily reads' cards). */
.reader-daily-images__reason {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-25);
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

/* One line box tall, so the icon centres on the first line when the text wraps. */
.reader-daily-images__reason-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 1lh;
}

.reader-daily-images__reason .cdx-icon {
  color: inherit;
}

.reader-daily-images__skeleton {
  aspect-ratio: 4 / 3;
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  background-color: var(--background-color-interactive-subtle);
}

.reader-daily-images__note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  color: var(--color-subtle);
}

.reader-daily-images__note p {
  margin: 0;
}
</style>
