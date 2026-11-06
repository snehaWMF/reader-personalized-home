<script setup lang="ts">
/**
 * The reader Home flow's start: a logged-out reader on an article, with a way
 * to the Home in the header. Links in the article stay in the flow.
 */
import { computed, onMounted } from 'vue'

import ArticleLive from '@/components/article/ArticleLive.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import { useWikiPageTitleQuery } from '@/composables/useWikiPageTitleQuery'
import { VISUAL_EDITOR_TEMPLATE_PATH } from '@/composables/webTemplatePaths'

import ReaderStartHeader from './ReaderStartHeader.vue'
import { READER_START_PATH, START_ARTICLE } from './readerHomeContent'

definePage({
  // A short address, without the folder's name repeating the repository's.
  path: '/start',
  meta: {
    platform: 'web',
  },
})

const { user } = useConfig()
const { titleFromQuery, setWikiPageTitle } = useWikiPageTitleQuery()

const article = computed(() => titleFromQuery.value || START_ARTICLE)

// Every run of the flow starts logged out.
onMounted(() => {
  user.value = 'logged-out'
})

function onTitleResolved(title: string) {
  if (title?.trim()) setWikiPageTitle(title)
}
</script>

<template>
  <ChromeWrapper>
    <template #header>
      <ReaderStartHeader />
    </template>

    <ArticleLive
      :edit-route="VISUAL_EDITOR_TEMPLATE_PATH"
      :wiki-link-route="READER_START_PATH"
      :article="article"
      @title-resolved="onTitleResolved"
    />
  </ChromeWrapper>
</template>
