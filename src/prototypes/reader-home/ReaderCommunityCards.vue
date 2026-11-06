<script setup lang="ts">
/**
 * "Most read on Wikipedia this week": the week's four most-read articles as
 * Codex cards, each with its rank as a green info chip ("1") and its views;
 * then "See all" to the full list on its own page.
 *
 * A country picker ("Worldwide" by default) sits at the heading's end on
 * Vector, and under the heading on Minerva, where the row is too narrow for
 * both. It's for show: picking a country changes its label, not the list.
 */
import { ref } from 'vue'
import { CdxIcon, CdxSelect } from '@wikimedia/codex'
import { cdxIconChart, cdxIconGlobe, cdxIconNext } from '@wikimedia/codex-icons'
import { RouterLink, useRoute } from 'vue-router'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { useSkin } from '@/composables/useSkin'

import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { loadTopReads, TOP_READS_COUNT } from './loadCommunityReads'
import ReaderCardList from './ReaderCardList.vue'
import { READER_HOME_PATH } from './readerHomeContent'

const route = useRoute()
const skin = useSkin()

/** The country the list is for; not wired up yet. */
const country = ref('worldwide')
const COUNTRIES = [
  { value: 'worldwide', label: 'Worldwide', icon: cdxIconGlobe },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'in', label: 'India' },
  { value: 'jp', label: 'Japan' },
  { value: 'mx', label: 'Mexico' },
  { value: 'ng', label: 'Nigeria' },
  { value: 'za', label: 'South Africa' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'us', label: 'United States' },
]

function seeAll(module: string) {
  return { path: `${READER_HOME_PATH}/${module}`, query: preservedQueryFromLocationQuery(route.query) }
}
</script>

<template>
  <HomeSectionFrame id="top-reads" title="Most read on Wikipedia this week">
    <template v-if="skin !== 'mobile'" #actions>
      <CdxSelect
        v-model:selected="country"
        :menu-items="COUNTRIES"
        :default-icon="cdxIconGlobe"
        :menu-config="{ visibleItemLimit: 8 }"
        aria-label="Country"
        class="reader-community__country"
      />
    </template>
    <div class="reader-community">
      <CdxSelect
        v-if="skin === 'mobile'"
        v-model:selected="country"
        :menu-items="COUNTRIES"
        :default-icon="cdxIconGlobe"
        :menu-config="{ visibleItemLimit: 8 }"
        aria-label="Country"
        class="reader-community__country"
      />
      <ReaderCardList :load="loadTopReads" :count="TOP_READS_COUNT" :supporting-icon="cdxIconChart" />

      <RouterLink class="reader-community__see-all" :to="seeAll('top-reads')">
        See all
        <CdxIcon :icon="cdxIconNext" size="small" />
      </RouterLink>
    </div>
  </HomeSectionFrame>
</template>

<style scoped>
/* CODEX+ CdxSelect: its handle is at least 256px; here wide enough for the longest country, no wider. */
.reader-community__country {
  min-width: 0;
  width: 200px;
}

.reader-community__country :deep(.cdx-select-vue__handle) {
  min-width: 0;
  width: 100%;
}

.reader-community {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* Codex Body bold link, with a trailing chevron (as the Home's other "See all…" links). */
.reader-community__see-all {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  align-self: flex-start;
  font-weight: var(--font-weight-bold);
  color: var(--color-progressive);
  text-decoration: none;
}

.reader-community__see-all .cdx-icon {
  color: inherit;
}

.reader-community__see-all:hover {
  color: var(--color-progressive--hover);
  text-decoration: underline;
}
</style>
