<script setup lang="ts">
/**
 * The logged-out header: Vector's Donate / Create account / Log in links, and
 * on Minerva search and the user menu, which offers Create account and Log in
 * (`ReaderMinervaUserMenu`). Create account
 * and Log in start the flow's own account page — the way in to the Home.
 */
import { computed, defineComponent, h, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import { MINERVA_DEFAULT_RIGHT } from '@/components/chrome/minervaHeaderDefaults'
import type { HeaderItem } from '@/components/header/headerItems'
import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { WIKIPEDIA_MAIN_PAGE_TITLE } from '@/composables/useWordmarkMainPageLink'

import { READER_CREATE_ACCOUNT_PATH, READER_START_PATH } from './readerHomeContent'
import ReaderMinervaUserMenu from './ReaderMinervaUserMenu.vue'
import { useReaderSearch } from './useReaderSearch'

const route = useRoute()
const router = useRouter()

// Search results open on the flow's logged-out article page.
useReaderSearch(READER_START_PATH)

/* The logo opens the Main Page on the flow's logged-out article page, so the reader stays in the flow. */
const mainPage = computed(() => ({
  path: READER_START_PATH,
  query: { ...preservedQueryFromLocationQuery(route.query), title: WIKIPEDIA_MAIN_PAGE_TITLE },
}))

function goToAccount(mode?: 'login'): void {
  void router.push({
    path: READER_CREATE_ACCOUNT_PATH,
    query: { ...preservedQueryFromLocationQuery(route.query), ...(mode ? { mode } : {}) },
  })
}

/* Minerva's logged-out bar: search, then the user menu with Create account and Log in. */
const minervaRight: HeaderItem[] = [
  ...MINERVA_DEFAULT_RIGHT.filter((item) => item.type === 'button' && item.label === 'Search'),
  {
    type: 'component',
    component: markRaw(
      defineComponent({
        name: 'ReaderMinervaLoggedOutMenu',
        setup: () => () => h(ReaderMinervaUserMenu, { loggedOut: true }),
      }),
    ),
  },
]
</script>

<template>
  <!-- The tool icons go nowhere; the logo opens the Main Page in the flow. -->
  <ChromeHeader :right="minervaRight" :prototyping-settings="false" :wordmark-to="mainPage">
    <template #username>
      <span class="reader-start-header__toolbar">
        <a class="reader-start-header__link" href="#" @click.prevent>Donate</a>
        <a class="reader-start-header__link" href="#" @click.prevent="goToAccount()">
          Create account
        </a>
        <a class="reader-start-header__link" href="#" @click.prevent="goToAccount('login')">
          Log in
        </a>
      </span>
    </template>
  </ChromeHeader>
</template>

<style scoped>
/* Vector's logged-out toolbar (`VectorChromeHeader`). */
.reader-start-header__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-75);
  margin-inline: var(--spacing-50);
}

.reader-start-header__link {
  color: var(--color-progressive);
  font-size: var(--font-size-small);
  line-height: 1.4;
  text-decoration: none;
}

.reader-start-header__link:hover {
  text-decoration: underline;
}
</style>
