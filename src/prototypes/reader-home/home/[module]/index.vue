<script setup lang="ts">
/**
 * A module on its own page — `/reader-home/home/<module>`, where Minerva's
 * "Show more" and "See all" lead — with every article as a full card, in
 * divider rows: Most read this week, and Suggested edits (its own feed,
 * `HomeSuggestedEdits`). The Home template's module page
 * (`template-home/[module]`), for the reader Home, so going back stays in it.
 * Any other path goes back to the reader Home.
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton } from '@wikimedia/codex'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import HomeArticleCards, { type HomeArticleCard } from '../../../template-home/HomeArticleCards.vue'
import HomeSuggestedEdits from '../../../template-home/HomeSuggestedEdits.vue'
import HomeSubpageHeader from '../../../template-home/HomeSubpageHeader.vue'
import { useModuleLoad } from '../../../template-home/useModuleLoad'
import {
  loadTopReads,
  TOP_READS_PAGE_COUNT,
} from '../../loadCommunityReads'
import { READER_ARTICLE_PATH, READER_HOME_PATH } from '../../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/homepage/:module' })

interface ModulePage {
  title: string
  /** Its cards; none for a module that lays out its own feed (`feed`). */
  load?: (signal: AbortSignal) => Promise<HomeArticleCard[]>
  skeletons?: number
  /** Renders its own feed: Suggested edits. */
  feed?: 'suggested-edits'
}

const MODULE_PAGES: Record<string, ModulePage> = {
  'top-reads': { title: 'Most read on Wikipedia this week', load: loadTopReads, skeletons: TOP_READS_PAGE_COUNT },
  'suggested-edits': { title: 'Suggested edits', feed: 'suggested-edits' },
}

const route = useRoute()
const router = useRouter()

const moduleId = computed(() => {
  const param = (route.params as { module?: string | string[] }).module
  return String(Array.isArray(param) ? param[0] : (param ?? ''))
})

const page = computed(() => MODULE_PAGES[moduleId.value] ?? null)

watch(
  page,
  (found) => {
    if (!found) {
      void router.replace({
        path: READER_HOME_PATH,
        query: preservedQueryFromLocationQuery(route.query),
      })
    }
  },
  { immediate: true },
)

// PROTOWIKI+ Router: no `scrollBehavior`, so a new page keeps the old scroll position.
watch(moduleId, () => window.scrollTo(0, 0), { immediate: true })

const { items, loading, error, reload } = useModuleLoad(
  () => moduleId.value,
  (signal) => (page.value?.load ? page.value.load(signal) : Promise.resolve([])),
)
</script>

<template>
  <ChromeWrapper :last-edited-notice="false" :show-footer="false">
    <template v-if="page" #header>
      <HomeSubpageHeader :title="page.title" :home-path="READER_HOME_PATH" />
    </template>

    <SpecialPageWrapper v-if="page" :title="null" class="home-module-page">
      <HomeSuggestedEdits v-if="page.feed === 'suggested-edits'" feed :home-path="READER_HOME_PATH" />
      <div v-else-if="error" class="home-module-page__error">
        <p>Couldn't load this section.</p>
        <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
      </div>
      <HomeArticleCards
        v-else
        :cards="items"
        :loading="loading"
        :skeletons="page.skeletons ?? 4"
        :to="READER_ARTICLE_PATH"
        feed
      />
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
/* The Home template's module page: the list starts right under the bar. */
.home-module-page[data-skin] {
  padding-top: 0;
}

.home-module-page[data-skin='mobile'] {
  padding-inline: var(--spacing-100);
}

.home-module-page[data-skin='desktop'] {
  max-width: none;
  padding-inline: var(--spacing-50);
}

.home-module-page__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  padding-top: var(--spacing-75);
  color: var(--color-subtle);
}

.home-module-page__error p {
  margin: 0;
}
</style>
