<script setup lang="ts">
/**
 * The Home's interests setting at the end of the page tabs: a settings icon and
 * "Interests" (the icon alone on Minerva). When it appears because the reader
 * closed the interests prompt, a popover points at it (`interestsHintPending`).
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CdxIcon, CdxPopover } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { interestsHintPending } from './readerFlowState'
import { FROM_HOME_QUERY, READER_INTERESTS_PATH } from './readerHomeContent'

const route = useRoute()

const location = computed(() => ({
  path: READER_INTERESTS_PATH,
  query: { ...preservedQueryFromLocationQuery(route.query), ...FROM_HOME_QUERY },
}))

const anchor = ref<HTMLElement | null>(null)
const hintOpen = ref(false)

// Once the link is laid out, so the popover lands on it.
onMounted(() => {
  if (!interestsHintPending.value) return
  interestsHintPending.value = false
  window.setTimeout(() => (hintOpen.value = true), 100)
})
</script>

<template>
  <span ref="anchor" class="reader-interests-link__anchor">
    <RouterLink class="reader-interests-link" :to="location">
      <CdxIcon :icon="cdxIconConfigure" size="small" />
      <span class="reader-interests-link__label">Interests</span>
    </RouterLink>
  </span>

  <CdxPopover
    v-model:open="hintOpen"
    :anchor="anchor"
    placement="bottom-end"
    use-close-button
    :primary-action="{ label: 'Got it', actionType: 'progressive' }"
    @primary="hintOpen = false"
  >
    <!-- Placeholder copy, to refine. -->
    You can always add your interests here.
  </CdxPopover>
</template>

<style scoped>
.reader-interests-link__anchor {
  display: inline-flex;
}

/* The page tabs' blue links (`HomePageHeader`), led by a settings icon. */
.reader-interests-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  color: var(--color-progressive);
  text-decoration: none;
}

.reader-interests-link .cdx-icon {
  color: inherit;
}

.reader-interests-link:hover {
  text-decoration: underline;
}

/* Minerva: the icon alone, so it fits beside the tabs on a phone; the label stays for screen readers. */
[data-skin='mobile'] .reader-interests-link__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* …and a full touch target around it. */
[data-skin='mobile'] .reader-interests-link {
  justify-content: center;
  min-width: var(--min-size-interactive-pointer);
  min-height: var(--min-size-interactive-pointer);
}
</style>
