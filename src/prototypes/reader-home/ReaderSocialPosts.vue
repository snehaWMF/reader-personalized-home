<script setup lang="ts">
/**
 * "Fun facts from Wikipedia" — a module on the prototype panel's checklist,
 * last on the Home. Short videos about articles (`SOCIAL_POSTS`) as portrait
 * stills with a play button and how long they run, each titled underneath. A
 * video opens in a dialog — a static mock, with what it's about and a way on
 * to the article. No likes, views or posting dates: something fun to watch,
 * not a social feed.
 */
import { computed, ref } from 'vue'
import { CdxDialog, CdxIcon } from '@wikimedia/codex'
import { cdxIconPlay } from '@wikimedia/codex-icons'

import { useWikiPrototypeNavigation } from '@/composables/useWikiPrototypeNavigation'

import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { SOCIAL_POSTS } from './moreModulesContent'
import { READER_ARTICLE_PATH } from './readerHomeContent'
import { useArticleThumbnails } from './useArticleThumbnails'

type Post = (typeof SOCIAL_POSTS)[number]

const { navigateToWikiPrototype } = useWikiPrototypeNavigation()
const thumbnails = useArticleThumbnails(SOCIAL_POSTS.map((post) => post.article))

const openPost = ref<Post | null>(null)
const dialogOpen = computed({
  get: () => openPost.value !== null,
  set: (open: boolean) => {
    if (!open) openPost.value = null
  },
})

function readArticle(): void {
  const article = openPost.value?.article
  openPost.value = null
  if (article) navigateToWikiPrototype(READER_ARTICLE_PATH, article)
}
</script>

<template>
  <HomeSectionFrame id="social-posts" title="Fun facts from Wikipedia">
    <div class="reader-social">
      <div v-for="post in SOCIAL_POSTS" :key="post.article" class="reader-social__item">
        <button
          type="button"
          class="reader-social__card"
          :aria-label="`Play: ${post.title}, ${post.duration}`"
          @click="openPost = post"
        >
          <img
            v-if="thumbnails[post.article]"
            class="reader-social__image"
            :src="thumbnails[post.article]"
            alt=""
          />
          <span class="reader-social__play" aria-hidden="true">
            <CdxIcon :icon="cdxIconPlay" />
          </span>
          <span class="reader-social__duration" aria-hidden="true">{{ post.duration }}</span>
        </button>
        <span class="reader-social__title">{{ post.title }}</span>
      </div>
    </div>
  </HomeSectionFrame>

  <CdxDialog
    v-model:open="dialogOpen"
    :title="openPost?.title ?? ''"
    use-close-button
    :primary-action="{ label: 'Read the article', actionType: 'progressive' }"
    :default-action="{ label: 'Close' }"
    @primary="readArticle"
    @default="openPost = null"
  >
    <!-- A static mock of the video: its still with a play button, then what it's about. -->
    <article v-if="openPost" class="reader-social-post">
      <div class="reader-social-post__media">
        <img
          v-if="thumbnails[openPost.article]"
          class="reader-social-post__image"
          :src="thumbnails[openPost.article]"
          :alt="openPost.article"
        />
        <span class="reader-social__play reader-social__play--large" aria-hidden="true">
          <CdxIcon :icon="cdxIconPlay" size="medium" />
        </span>
      </div>
      <p class="reader-social-post__caption">{{ openPost.caption }}</p>
    </article>
  </CdxDialog>
</template>

<style scoped>
/* Four portrait videos to a row; on Minerva a row that scrolls sideways. */
.reader-social {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-50);
}

[data-skin='mobile'] .reader-social {
  grid-template-columns: none;
  grid-auto-flow: column;
  grid-auto-columns: 148px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

/* Just the post: a portrait still in a Codex card's outline, the play button over it. */
.reader-social__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  min-width: 0;
  scroll-snap-align: start;
}

.reader-social__card {
  position: relative;
  display: block;
  width: 100%;
  /* Portrait, but not as tall as a phone video, so wide photos keep their subject. */
  aspect-ratio: 3 / 4;
  padding: 0;
  overflow: hidden;
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-interactive-subtle);
  cursor: pointer;
}

.reader-social__card:hover {
  border-color: var(--border-color-interactive);
}

.reader-social__card:focus-visible {
  outline: var(--border-width-thick) solid var(--border-color-progressive--focus);
}

.reader-social__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* A dark circle with a white play glyph, centred on the still. */
.reader-social__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--size-300);
  height: var(--size-300);
  border-radius: var(--border-radius-circle);
  background-color: rgba(0, 0, 0, 0.55);
  transform: translate(-50%, -50%);
}

.reader-social__play .cdx-icon {
  color: #fff;
}

/* How long it runs, in the still's corner. */
.reader-social__duration {
  position: absolute;
  right: var(--spacing-25);
  bottom: var(--spacing-25);
  padding: 0 var(--spacing-25);
  border-radius: var(--border-radius-base);
  background-color: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: var(--font-size-x-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
}

/* Codex Body small bold: the video's title. */
.reader-social__title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
  color: var(--color-emphasized);
}

.reader-social__play--large {
  width: var(--size-400);
  height: var(--size-400);
}

.reader-social-post {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

.reader-social-post__media {
  position: relative;
}

.reader-social-post__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: var(--border-radius-base);
}

.reader-social-post__caption {
  margin: 0;
}
</style>
