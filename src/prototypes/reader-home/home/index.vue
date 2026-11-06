<script setup lang="ts">
/**
 * The personalized Home: the greeting and tabs over its modules
 * (`ReaderHomeBody`), which the bottom-left prototype panel turns on and off.
 */

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import HomePageHeader from '../../template-home/HomePageHeader.vue'
import PrototypePanel from '../PrototypePanel.vue'
import { interestsPromptDismissed, personalized } from '../readerFlowState'
import { READER_USERNAME } from '../readerHomeContent'
import ReaderHomeBody from '../ReaderHomeBody.vue'
import ReaderInterestsLink from '../ReaderInterestsLink.vue'
import ReaderSignedInHeader from '../ReaderSignedInHeader.vue'
import { useSavedArticlesSync } from '../sampleSaves'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/homepage' })

const { user } = useConfig()

// The Home is for logged-in readers: opened directly while logged out, it logs the Mock user in.
if (user.value === 'logged-out') user.value = 'new'

// The article bookmark and the reader's saves stay in step.
useSavedArticlesSync()
</script>

<template>
  <ChromeWrapper :last-edited-notice="false">
    <template #header>
      <ReaderSignedInHeader />
    </template>

    <SpecialPageWrapper :title="null" class="home-page">
      <HomePageHeader :title="`Hello, ${READER_USERNAME}!`">
        <!-- Not personalized: the prompt below offers interests instead, until it's closed. -->
        <template v-if="personalized || interestsPromptDismissed" #tabs-end>
          <ReaderInterestsLink />
        </template>
      </HomePageHeader>
      <ReaderHomeBody />
    </SpecialPageWrapper>
  </ChromeWrapper>

  <PrototypePanel />
</template>

<style scoped>
/* The Home template's page (`template-home/index.vue`). */
.home-page {
  padding-bottom: var(--spacing-300);
}

/* PROTOWIKI+ SpecialPageWrapper: mobile gutter is the desktop one. */
.home-page[data-skin='mobile'] {
  padding-inline: var(--spacing-100);
}

/* PROTOWIKI+ SpecialPageWrapper: no content-width option — the Home's 984px column. */
.home-page[data-skin='desktop'] {
  max-width: calc(984px + 2 * var(--spacing-150));
}
</style>
