<script setup lang="ts">
/**
 * An article opened from the Home, for a logged-in reader: the header's Home
 * link (`ReaderSignedInHeader`), with the one-time popover pointing at it.
 * Links in the article stay here. With `?image=` (a file name, from Wikipedia
 * in pictures), it opens scrolled to that image; with `?section=`
 * (a heading, from Inside your saved articles), at that section.
 */
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import { useWikiPageTitleQuery } from '@/composables/useWikiPageTitleQuery'
import { VISUAL_EDITOR_TEMPLATE_PATH } from '@/composables/webTemplatePaths'

import ReaderSignedInHeader from '../ReaderSignedInHeader.vue'
import { useSavedArticlesSync } from '../sampleSaves'
import { READER_ARTICLE_PATH } from '../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/article' })

const { user } = useConfig()
const { titleFromQuery, setWikiPageTitle } = useWikiPageTitleQuery()

// Only reached from the Home, so the reader is logged in.
if (user.value === 'logged-out') user.value = 'new'

// The bookmark in the article's header saves and unsaves, and shows what's saved.
useSavedArticlesSync()

function onTitleResolved(title: string) {
  if (title?.trim()) setWikiPageTitle(title)
}

const route = useRoute()

/*
 * An article opens at its top. Otherwise it keeps the page it came from's
 * scroll position — far down, when opened from a module low on the Home — as
 * there's no router scroll handling. Again for each article opened from here.
 */
onMounted(() => window.scrollTo(0, 0))
watch(
  () => route.query.title,
  () => window.scrollTo(0, 0),
)

/** File names as they appear in image URLs: underscores, no "File:", decoded. */
function fileKey(name: string): string {
  return decodeURIComponent(name).replace(/^File:/i, '').replace(/ /g, '_')
}

/** The image `?image=` names, if it's in the article. */
function imageTarget(root: HTMLElement): HTMLElement | null {
  const image = route.query.image
  if (typeof image !== 'string' || !image) return null
  const key = fileKey(image)
  const match = [...root.querySelectorAll<HTMLImageElement>('img')].find((img) =>
    fileKey(img.getAttribute('src') ?? '').includes(key),
  )
  return match?.closest('figure') ?? match ?? null
}

/** The heading `?section=` names, if the article has it. */
function sectionTarget(root: HTMLElement): HTMLElement | null {
  const section = route.query.section
  if (typeof section !== 'string' || !section) return null
  const wanted = section.trim().toLowerCase()
  const id = section.trim().replace(/ /g, '_')
  // By its id, else its text (without an "[edit]" link some headings carry).
  return (
    [...root.querySelectorAll<HTMLElement>('h2, h3, h4')].find(
      (heading) =>
        heading.id === id ||
        heading.textContent?.replace(/\[edit\]\s*$/i, '').trim().toLowerCase() === wanted,
    ) ?? null
  )
}

/** Scroll to the image or section asked for, once the article is on the page. */
function onParserReady(root: HTMLElement) {
  const image = imageTarget(root)
  const section = image ? null : sectionTarget(root)
  // After layout settles, so it lands where it'll stay.
  window.setTimeout(() => {
    if (image) image.scrollIntoView({ block: 'center' })
    else section?.scrollIntoView({ block: 'start' })
  }, 300)
}
</script>

<template>
  <ChromeWrapper>
    <template #header>
      <ReaderSignedInHeader hint />
    </template>

    <ArticleLive
      :edit-route="VISUAL_EDITOR_TEMPLATE_PATH"
      :wiki-link-route="READER_ARTICLE_PATH"
      :article="titleFromQuery"
      @title-resolved="onTitleResolved"
      @parser-ready="onParserReady"
    />
  </ChromeWrapper>
</template>
