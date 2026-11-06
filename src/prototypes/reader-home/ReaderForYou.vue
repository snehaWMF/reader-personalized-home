<script setup lang="ts">
/**
 * The reader's own modules as one full-width column, each module's cards two
 * to a row on Vector (one on Minerva). Each shows when it's on in the
 * prototype panel's checklist (`moduleOn`).
 *
 * Not personalized: a prompt to pick interests first. A reader here to edit
 * too (a bit of both, or mainly editing) gets Suggested edits next, above
 * everything else; their other editing modules go in the right column
 * (`ReaderEditingModules`). Then Suggested reads (`ReaderDailyReads`;
 * `noFeatured` leaves today's featured article out of it), Wikipedia in
 * pictures, Did you know…, Inside your saved articles, Your collections and
 * Challenge your knowledge.
 *
 * `#after-own` goes after all of them.
 */
import ReaderCollections from './ReaderCollections.vue'
import ReaderDailyImages from './ReaderDailyImages.vue'
import ReaderDailyReads from './ReaderDailyReads.vue'
import ReaderInterestFacts from './ReaderInterestFacts.vue'
import ReaderKnowledgeGame from './ReaderKnowledgeGame.vue'
import ReaderPersonalizePrompt from './ReaderPersonalizePrompt.vue'
import ReaderRediscover from './ReaderRediscover.vue'
import ReaderSuggestedEdits from './ReaderSuggestedEdits.vue'
import { moduleOn, personalized, wantsEditing } from './readerFlowState'

defineProps<{ noFeatured?: boolean }>()
</script>

<template>
  <ReaderPersonalizePrompt v-if="!personalized" />

  <!-- Here to edit too (a bit of both, or mainly editing): Suggested edits leads, above Suggested reads. -->
  <ReaderSuggestedEdits v-if="wantsEditing" />

  <ReaderDailyReads v-if="moduleOn('daily-reads')" :no-featured="noFeatured" />

  <ReaderDailyImages v-if="moduleOn('daily-images')" />
  <ReaderInterestFacts v-if="moduleOn('interest-facts')" />

  <ReaderRediscover v-if="moduleOn('rediscover')" />
  <ReaderCollections v-if="moduleOn('collections')" />

  <ReaderKnowledgeGame v-if="moduleOn('knowledge-game')" />

  <!-- After the reader's own modules (the community's). -->
  <slot name="after-own" />
</template>

<style>
/*
 * Unscoped: `.reader-two-up` on a concept's container sets every module's cards
 * (and their skeletons) inside it two to a row on Vector — one on narrow
 * windows, and one when a right column (`ReaderWithSide`) leaves the main
 * column too narrow for two.
 */
.home-page[data-skin='desktop'] .reader-two-up .home-article-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-page[data-skin='desktop'] .reader-two-up.reader-with-side--split .home-article-cards {
  grid-template-columns: minmax(0, 1fr);
}

@media (max-width: 767px) {
  .home-page[data-skin='desktop'] .reader-two-up .home-article-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
