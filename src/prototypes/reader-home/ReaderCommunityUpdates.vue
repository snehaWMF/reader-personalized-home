<script setup lang="ts">
/**
 * Community updates for a reader here to edit too: one announcement
 * (`COMMUNITY_UPDATE`) — an image, headline and short text, then a link. The
 * link is a mock: it goes nowhere yet.
 */
import { CdxCard } from '@wikimedia/codex'

import { COMMUNITY_UPDATE } from './moreModulesContent'
import { useArticleThumbnails } from './useArticleThumbnails'

const thumbnails = useArticleThumbnails([COMMUNITY_UPDATE.imageArticle])
</script>

<template>
  <div class="reader-community-updates">
    <CdxCard
      :thumbnail="
        thumbnails[COMMUNITY_UPDATE.imageArticle]
          ? { url: thumbnails[COMMUNITY_UPDATE.imageArticle] }
          : null
      "
      thumbnail-size="large"
      force-thumbnail
      class="reader-community-updates__card"
    >
      <template #title>{{ COMMUNITY_UPDATE.headline }}</template>
      <template #description>{{ COMMUNITY_UPDATE.text }}</template>
    </CdxCard>
    <a class="reader-community-updates__link" href="#" @click.prevent>
      {{ COMMUNITY_UPDATE.linkLabel }}
    </a>
  </div>
</template>

<style scoped>
/* The link sits inside the card's outline, under its text, as in the design. */
.reader-community-updates {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
  padding-bottom: var(--spacing-75);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
}

.reader-community-updates__card {
  border: 0;
}

/* Codex Body bold link. */
.reader-community-updates__link {
  padding-inline: var(--spacing-75);
  font-weight: var(--font-weight-bold);
}
</style>
