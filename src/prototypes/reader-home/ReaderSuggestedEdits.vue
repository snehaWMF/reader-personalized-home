<script setup lang="ts">
/**
 * Suggested edits for a reader here to edit too: the Home template's module
 * (`HomeSuggestedEdits`). A reader who hasn't picked interests gets the
 * Home's own prompt for them at the top (`ReaderPersonalizePrompt`).
 */
import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import HomeSuggestedEdits from '../template-home/HomeSuggestedEdits.vue'
import { SUGGESTED_EDITS_MENU } from '../template-home/homeModuleMenus'
import { READER_HOME_PATH } from './readerHomeContent'
</script>

<template>
  <HomeSectionFrame id="suggested-edits" title="Suggested edits">
    <template #actions>
      <HomeModuleMenu :menu="SUGGESTED_EDITS_MENU" />
    </template>

    <!-- Minerva's "Show more" opens its page in the reader Home, not the Home template's. -->
    <HomeSuggestedEdits :home-path="READER_HOME_PATH" />
  </HomeSectionFrame>
</template>
