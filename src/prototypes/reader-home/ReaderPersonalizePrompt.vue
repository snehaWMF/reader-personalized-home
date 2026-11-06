<script setup lang="ts">
/**
 * The not-personalized Home's invitation to pick interests: a dismissible
 * notice with a button to the interests picker. Closed, the Interests link
 * appears by the tabs with a popover pointing at it (`ReaderInterestsLink`).
 */
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxMessage } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { interestsHintPending, interestsPromptDismissed } from './readerFlowState'
import { FROM_HOME_QUERY, READER_INTERESTS_PATH } from './readerHomeContent'

const route = useRoute()
const router = useRouter()

function selectInterests(): void {
  void router.push({
    path: READER_INTERESTS_PATH,
    query: { ...preservedQueryFromLocationQuery(route.query), ...FROM_HOME_QUERY },
  })
}

function dismiss(): void {
  interestsPromptDismissed.value = true
  interestsHintPending.value = true
}
</script>

<template>
  <CdxMessage
    v-if="!interestsPromptDismissed"
    :icon="cdxIconConfigure"
    allow-user-dismiss
    @user-dismissed="dismiss"
  >
    <p class="reader-personalize__text">Get articles that match your interests.</p>
    <CdxButton @click="selectInterests">Select interests</CdxButton>
  </CdxMessage>
</template>

<style scoped>
.reader-personalize__text {
  margin: 0 0 var(--spacing-50);
}
</style>
