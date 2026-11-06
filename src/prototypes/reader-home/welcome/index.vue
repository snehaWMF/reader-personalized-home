<script setup lang="ts">
/**
 * Onboarding's second screen, after the greeting: what brings the reader to
 * Wikipedia. Picking an answer goes on to their interests; Skip goes straight to
 * a Home that isn't personalized.
 */
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxCard } from '@wikimedia/codex'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import ReaderOnboardingPanel from '../ReaderOnboardingPanel.vue'
import { pickedInterests, readerPurpose } from '../readerFlowState'
import {
  READER_GREETING_PATH,
  READER_HOME_PATH,
  READER_INTERESTS_PATH,
  READER_PURPOSES,
} from '../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/welcome' })

const route = useRoute()
const router = useRouter()

function go(path: string): void {
  void router.push({ path, query: preservedQueryFromLocationQuery(route.query) })
}

function choose(id: string): void {
  readerPurpose.value = id
  go(READER_INTERESTS_PATH)
}

function skip(): void {
  readerPurpose.value = null
  pickedInterests.value = []
  go(READER_HOME_PATH)
}
</script>

<template>
  <ReaderOnboardingPanel
    title="What brings you to Wikipedia?"
    :step="2"
    @back="go(READER_GREETING_PATH)"
  >
    <div class="reader-purposes">
      <CdxCard
        v-for="purpose in READER_PURPOSES"
        :key="purpose.id"
        url="#"
        class="reader-purposes__option"
        @click.prevent="choose(purpose.id)"
      >
        <template #title>{{ purpose.title }}</template>
        <template #description>{{ purpose.description }}</template>
      </CdxCard>
    </div>

    <template #actions>
      <CdxButton weight="quiet" @click="skip">Skip</CdxButton>
    </template>
  </ReaderOnboardingPanel>
</template>

<style scoped>
.reader-purposes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}
</style>
