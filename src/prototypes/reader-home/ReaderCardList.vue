<script setup lang="ts">
/**
 * A module's body as article cards, from any loader: skeletons while loading,
 * "Try again" on error, a note when empty. Reloads whenever `sourceKey` changes.
 * Cards open the reader's article page, with its way back to the Home.
 */
import { computed } from 'vue'
import { CdxButton } from '@wikimedia/codex'
import type { Icon } from '@wikimedia/codex-icons'

import HomeArticleCards, { type HomeArticleCard } from '../template-home/HomeArticleCards.vue'
import { useModuleLoad } from '../template-home/useModuleLoad'
import { READER_ARTICLE_PATH } from './readerHomeContent'

const props = defineProps<{
  load: (signal: AbortSignal) => Promise<HomeArticleCard[]>
  /** What the cards come from; a change reloads them. */
  sourceKey?: string
  /** Cards shown at most — also the skeletons while loading. */
  count: number
  supportingIcon?: Icon
  /** Codex's small thumbnails (`HomeArticleCards`). */
  smallThumbnails?: boolean
}>()

const { items, loading, error, reload } = useModuleLoad(
  () => `${props.count}\n${props.sourceKey ?? ''}`,
  (signal) => props.load(signal),
)

const cards = computed(() => items.value.slice(0, props.count))
</script>

<template>
  <div class="reader-card-list">
    <div v-if="error" class="reader-card-list__note">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <p v-else-if="!loading && !cards.length" class="reader-card-list__note">
      Nothing here right now.
    </p>

    <HomeArticleCards
      v-else
      :cards="cards"
      :loading="loading"
      :skeletons="count"
      :to="READER_ARTICLE_PATH"
      :supporting-icon="supportingIcon"
      :small-thumbnails="smallThumbnails"
    />
  </div>
</template>

<style scoped>
.reader-card-list__note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  margin: 0;
  color: var(--color-subtle);
}

.reader-card-list__note p {
  margin: 0;
}
</style>
