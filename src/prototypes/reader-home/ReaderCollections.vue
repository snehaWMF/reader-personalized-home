<script setup lang="ts">
/**
 * "Your collections": the reader's collections of saved articles
 * (`sampleCollections`: one per interest), most recently updated first, as cards — the
 * collection's name, a few of its articles, and how many it holds, after
 * Codex's bookmark-list icon rather than a picture, so they don't read as
 * article cards. Then a link to all their collections.
 *
 * The prototype has no collection page yet, so neither the cards nor the link
 * go anywhere: the cards aren't links, and the link only looks like one (as
 * "Go to your saved articles" in Inside your saved articles).
 */
import { computed } from 'vue'
import { CdxCard, CdxIcon } from '@wikimedia/codex'
import { cdxIconBookmarkList, cdxIconNext } from '@wikimedia/codex-icons'

import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { sampleCollections } from './sampleSaves'

const COUNT = 4

const collections = computed(() =>
  [...sampleCollections.value].sort((a, b) => a.updatedDaysAgo - b.updatedDaysAgo).slice(0, COUNT),
)

/** "Clownfish, Great Barrier Reef and 2 more". */
function preview(articles: string[]): string {
  const shown = articles.slice(0, 2).join(', ')
  const more = articles.length - 2
  return more > 0 ? `${shown} and ${more} more` : shown
}

function updated(days: number): string {
  return days === 0 ? 'Updated today' : days === 1 ? 'Updated yesterday' : `Updated ${days} days ago`
}
</script>

<template>
  <HomeSectionFrame id="collections" title="Your collections">
    <div class="reader-collections">
      <!-- `home-article-cards`: laid out like every other module's cards (two to a row on wide Vector). -->
      <div class="home-article-cards reader-collections__cards">
        <CdxCard
          v-for="collection in collections"
          :key="collection.name"
          class="reader-collections__card"
          :icon="cdxIconBookmarkList"
        >
          <template #title>{{ collection.name }}</template>
          <template #description>{{ preview(collection.articles) }}</template>
          <template #supporting-text>
            <span class="reader-collections__meta">
              <span>{{ collection.articles.length }} articles</span>
              <span aria-hidden="true">·</span>
              <span>{{ updated(collection.updatedDaysAgo) }}</span>
            </span>
          </template>
        </CdxCard>
      </div>

      <!-- Looks like a link, but goes nowhere in the prototype yet. -->
      <span class="reader-collections__more">
        Go to your collections
        <CdxIcon :icon="cdxIconNext" size="small" />
      </span>
    </div>
  </HomeSectionFrame>
</template>

<style scoped>
.reader-collections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* `HomeArticleCards`' list rule, for cards drawn here. */
.reader-collections__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* CODEX+ CdxCard: supporting text pinned to the bottom (as `HomeArticleCards`). */
.reader-collections__card :deep(.cdx-card__text) {
  flex-grow: 1;
  align-self: stretch;
}

.reader-collections__card :deep(.cdx-card__text__supporting-text) {
  margin-top: auto;
  padding-top: var(--spacing-50);
}

.reader-collections__meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-25);
}

/* Codex Body bold link, with a trailing chevron. */
.reader-collections__more {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  align-self: flex-start;
  font-weight: var(--font-weight-bold);
  color: var(--color-progressive);
}

.reader-collections__more .cdx-icon {
  color: inherit;
}

.reader-collections__more:hover {
  color: var(--color-progressive--hover);
  text-decoration: underline;
}
</style>
