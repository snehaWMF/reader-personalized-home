<script setup lang="ts">
/**
 * The logged-in header across the flow, with the way back to the Home. On
 * Vector, the username is it (`ReaderHomeLink` — a home icon and the
 * username), in place of the plain username link. On Minerva, it's the first
 * item in the user menu (`ReaderMinervaUserMenu`, the avatar with a dropdown
 * arrow). `hint` shows the one-time popover pointing at it (articles only).
 */
import { computed, defineComponent, h, markRaw } from 'vue'
import { useRoute } from 'vue-router'

import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import { MINERVA_DEFAULT_RIGHT } from '@/components/chrome/minervaHeaderDefaults'
import type { HeaderItem } from '@/components/header/headerItems'
import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { WIKIPEDIA_MAIN_PAGE_TITLE } from '@/composables/useWordmarkMainPageLink'

import ReaderHomeLink from './ReaderHomeLink.vue'
import ReaderMinervaUserMenu from './ReaderMinervaUserMenu.vue'
import { useReaderSearch } from './useReaderSearch'
import { READER_ARTICLE_PATH, READER_USERNAME } from './readerHomeContent'

const props = defineProps<{ hint?: boolean }>()

const route = useRoute()

// Search results open on the flow's article page.
useReaderSearch(READER_ARTICLE_PATH)

/* The logo opens the Main Page inside the flow (as Community curated's link), so the reader stays logged in here. */
const mainPage = computed(() => ({
  path: READER_ARTICLE_PATH,
  query: { ...preservedQueryFromLocationQuery(route.query), title: WIKIPEDIA_MAIN_PAGE_TITLE },
}))

/* Minerva's bar as usual, but its user menu leads to the Home. */
const minervaRight: HeaderItem[] = MINERVA_DEFAULT_RIGHT.map((item) =>
  item.type === 'button' && item.label === 'User menu'
    ? {
        type: 'component',
        component: markRaw(
          defineComponent({
            name: 'ReaderMinervaUserMenuItem',
            setup: () => () => h(ReaderMinervaUserMenu, { hint: props.hint }),
          }),
        ),
      }
    : item,
)
</script>

<template>
  <!-- The tool icons go nowhere; the Home link does, and the logo opens the Main Page in the flow. -->
  <ChromeHeader :username="READER_USERNAME" :right="minervaRight" :prototyping-settings="false" :wordmark-to="mainPage">
    <template #username>
      <ReaderHomeLink :hint="hint" />
    </template>
  </ChromeHeader>
</template>
