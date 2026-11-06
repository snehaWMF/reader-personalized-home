<script setup lang="ts">
/**
 * Onboarding's first screen, right after creating an account: the baby globe
 * welcomes the reader by name. "Personalize your Home" goes on to what brings
 * them to Wikipedia; closing goes straight to a Home that isn't personalized.
 */
import { useRoute, useRouter } from 'vue-router'
import { CdxButton } from '@wikimedia/codex'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import welcomeGlobe from '../assets/welcome-globe.png'
import ReaderOnboardingPanel from '../ReaderOnboardingPanel.vue'
import { pickedInterests, readerPurpose } from '../readerFlowState'
import { READER_HOME_PATH, READER_USERNAME, READER_WELCOME_PATH } from '../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/hello' })

const route = useRoute()
const router = useRouter()

function go(path: string): void {
  void router.push({ path, query: preservedQueryFromLocationQuery(route.query) })
}

function close(): void {
  readerPurpose.value = null
  pickedInterests.value = []
  go(READER_HOME_PATH)
}
</script>

<template>
  <ReaderOnboardingPanel
    :title="`Welcome to Wikipedia, ${READER_USERNAME}!`"
    :step="1"
    closable
    serif-title
    @close="close"
  >
    <div class="reader-hello">
      <!-- The baby globe celebrating, from the design mockup. -->
      <img class="reader-hello__globe" :src="welcomeGlobe" alt="" width="240" height="230" />
    </div>

    <template #actions>
      <CdxButton
        class="reader-hello__next"
        action="progressive"
        weight="primary"
        size="large"
        @click="go(READER_WELCOME_PATH)"
      >
        Personalize your Home
      </CdxButton>
    </template>
  </ReaderOnboardingPanel>
</template>

<style scoped>
/* The globe centred in the space between the title and the button. */
.reader-hello {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 280px;
}

.reader-hello__globe {
  width: 240px;
  max-width: 70%;
  height: auto;
}

.reader-hello__next {
  width: 100%;
  max-width: none;
}
</style>
