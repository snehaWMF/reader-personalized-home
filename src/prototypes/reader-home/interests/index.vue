<script setup lang="ts">
/**
 * The reader's interests: onboarding's last screen, and the Home's interests
 * setting (opened with `?from=home`, where back returns to the Home).
 *
 * The reader picks articles: by searching Wikipedia (real title search, each
 * result with its thumbnail and short description), or from "Related reads" (the first three examples). Each
 * pick is a chip in the search field and seeds "Related to …" picks on the
 * Home. Going on with none picked is skipping: the Home isn't personalized.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxCard, CdxIcon, CdxMultiselectLookup, CdxToggleButton } from '@wikimedia/codex'
import type { ChipInputItem, MenuItemData } from '@wikimedia/codex'
import { cdxIconAdd, cdxIconCheck } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { fetchTitleSearchResults } from '@/components/search/titleSearch'

import { fetchReadingListPages } from '../../template-saved-pages/fetchReadingListPages'
import ReaderOnboardingPanel from '../ReaderOnboardingPanel.vue'
import { pickedInterests } from '../readerFlowState'
import {
  EXAMPLE_TOPICS,
  READER_HOME_PATH,
  READER_WELCOME_PATH,
  type PickedInterest,
} from '../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/interests' })

const route = useRoute()
const router = useRouter()

const fromHome = computed(() => route.query.from === 'home')

/* What's known about each article that can be picked, by title: the examples, search results and earlier picks. */
const known = new Map<string, PickedInterest>()
EXAMPLE_TOPICS.forEach((topic) => known.set(topic.article, { seed: topic.article, name: topic.label }))
pickedInterests.value.forEach((pick) => known.set(pick.seed, pick))

/* The picks on screen, as the lookup's selection and chips; saved only on going on. */
const selected = ref<string[]>(pickedInterests.value.map((pick) => pick.seed))
const chips = ref<ChipInputItem[]>(
  pickedInterests.value.map((pick) => ({ value: pick.seed, label: pick.name })),
)

/* ---- Search ---- */

const inputValue = ref<string | number>('')
const menuItems = ref<MenuItemData[]>([])
let searchController: AbortController | null = null
let searchTimer: number | undefined

function onInput(value: string | number): void {
  window.clearTimeout(searchTimer)
  searchController?.abort()
  const query = String(value ?? '').trim()
  if (!query) {
    menuItems.value = []
    return
  }
  searchTimer = window.setTimeout(async () => {
    const controller = new AbortController()
    searchController = controller
    try {
      const results = await fetchTitleSearchResults(query, {
        signal: controller.signal,
        limit: 6,
        clientTag: 'reader-home-interests',
      })
      if (controller.signal.aborted) return
      results.forEach((result) => {
        if (!known.has(result.title)) {
          known.set(result.title, {
            seed: result.title,
            name: result.title,
            description: result.description || undefined,
            thumbnailUrl: result.thumbnailSrc,
          })
        }
      })
      menuItems.value = results.map((result) => ({
        value: result.title,
        label: result.title,
        description: result.description,
        thumbnail: result.thumbnailSrc ? { url: result.thumbnailSrc } : null,
      }))
    } catch (err) {
      if (!controller.signal.aborted) console.error(err)
    }
  }, 200)
}

const menuConfig = { showThumbnail: true, visibleItemLimit: 6 }

/* ---- Related reads: the first three examples, so the panel keeps its height ---- */

const SHOWN_TOPICS = EXAMPLE_TOPICS.slice(0, 3)

/* Each example's thumbnail, by article — the cards show without one until it loads (or if it fails). */
const thumbnails = shallowRef<Record<string, string>>({})
const controller = new AbortController()

onMounted(async () => {
  try {
    const pages = await fetchReadingListPages(
      SHOWN_TOPICS.map((topic) => topic.article),
      { signal: controller.signal, lang: 'en' },
    )
    const found: Record<string, string> = {}
    pages.forEach((page, index) => {
      if (page.kind === 'page' && page.thumbnailUrl) found[SHOWN_TOPICS[index].article] = page.thumbnailUrl
    })
    thumbnails.value = found
  } catch (err) {
    if (!controller.signal.aborted) console.error(err)
  }
})
onBeforeUnmount(() => {
  controller.abort()
  searchController?.abort()
  window.clearTimeout(searchTimer)
})

function isPicked(article: string): boolean {
  return selected.value.includes(article)
}

function toggleExample(article: string, label: string): void {
  if (isPicked(article)) {
    selected.value = selected.value.filter((value) => value !== article)
    chips.value = chips.value.filter((chip) => chip.value !== article)
  } else {
    selected.value = [...selected.value, article]
    chips.value = [...chips.value, { value: article, label }]
  }
}

/* ---- Going on ---- */

function go(path: string): void {
  void router.push({ path, query: preservedQueryFromLocationQuery(route.query) })
}

function finish(): void {
  // None picked is skipping: the Home that isn't personalized.
  pickedInterests.value = selected.value.map(
    (title) => known.get(title) ?? { seed: title, name: title },
  )
  go(READER_HOME_PATH)
}
</script>

<template>
  <ReaderOnboardingPanel
    title="What are 3 of your interests?"
    :step="fromHome ? undefined : 3"
    @back="go(fromHome ? READER_HOME_PATH : READER_WELCOME_PATH)"
  >
    <p class="reader-interests__intro">Pick articles you like. Your Home will suggest more like them.</p>

    <CdxMultiselectLookup
      v-model:input-chips="chips"
      v-model:selected="selected"
      v-model:input-value="inputValue"
      :menu-items="menuItems"
      :menu-config="menuConfig"
      placeholder="Search articles"
      aria-label="Search articles"
      class="reader-interests__search"
      @input="onInput"
    >
      <template #no-results>No articles found.</template>
    </CdxMultiselectLookup>

    <h2 class="reader-interests__heading">Related reads</h2>
    <div class="reader-interests__examples">
      <CdxCard
        v-for="topic in SHOWN_TOPICS"
        :key="topic.article"
        :thumbnail="thumbnails[topic.article] ? { url: thumbnails[topic.article] } : null"
        force-thumbnail
        class="reader-interests__example"
        :class="{ 'reader-interests__example--picked': isPicked(topic.article) }"
      >
        <template #title>
          <span class="reader-interests__example-title">
            <span>{{ topic.label }}</span>
            <CdxToggleButton
              :model-value="isPicked(topic.article)"
              :aria-label="isPicked(topic.article) ? `Remove ${topic.label}` : `Add ${topic.label}`"
              icon-only
              quiet
              @update:model-value="toggleExample(topic.article, topic.label)"
            >
              <CdxIcon :icon="isPicked(topic.article) ? cdxIconCheck : cdxIconAdd" />
            </CdxToggleButton>
          </span>
        </template>
      </CdxCard>
    </div>

    <template #actions>
      <CdxButton
        class="reader-interests__done"
        action="progressive"
        weight="primary"
        size="large"
        @click="finish"
      >
        Go to your Home
      </CdxButton>
    </template>
  </ReaderOnboardingPanel>
</template>

<style scoped>
.reader-interests__intro {
  margin: 0 0 var(--spacing-100);
  color: var(--color-subtle);
}

/* CODEX+ CdxMultiselectLookup: capped at 680px by default; here it spans the panel. */
.reader-interests__search {
  max-width: none;
}

/* Codex Body bold, subtle — the mockup's "Related articles" label. */
.reader-interests__heading {
  margin: var(--spacing-150) 0 var(--spacing-75);
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
  color: var(--color-subtle);
}

.reader-interests__examples {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* The title centred on the thumbnail, with nothing under it. */
.reader-interests__example {
  align-items: center;
}

/* CODEX+ CdxCard: no selected state. A picked example takes the progressive outline. */
.reader-interests__example--picked {
  border-color: var(--border-color-progressive);
}

.reader-interests__example :deep(.cdx-card__text) {
  flex-grow: 1;
}

/* The toggle at the card's end, across from the label. */
.reader-interests__example-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-50);
}

.reader-interests__done {
  width: 100%;
  max-width: none;
}
</style>
