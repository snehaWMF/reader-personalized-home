<script setup lang="ts">
/**
 * A logged-in reader's way back to their Home, in the header: a home icon then
 * their username, linking to the Home — on every logged-in page, the Home too.
 * With `hint`, the first time they open an article from the Home, a popover
 * points at it to say so (`homeLinkHintSeen`).
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CdxIcon, CdxPopover } from '@wikimedia/codex'
import { cdxIconHome } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { homeLinkHintSeen } from './readerFlowState'
import { READER_HOME_PATH, READER_USERNAME } from './readerHomeContent'

const props = defineProps<{
  /** Minerva's bar: sized like its icon buttons. */
  compact?: boolean
  /** Point the one-time popover at the link (on articles opened from the Home). */
  hint?: boolean
}>()

const route = useRoute()

const anchor = ref<HTMLElement | null>(null)
const hintOpen = ref(false)

const homeLocation = computed(() => ({
  path: READER_HOME_PATH,
  query: preservedQueryFromLocationQuery(route.query),
}))

// After the article has had a moment to lay out, so the popover lands on the link.
onMounted(() => {
  if (!props.hint || homeLinkHintSeen.value) return
  window.setTimeout(() => (hintOpen.value = true), 600)
})

function onHintOpen(open: boolean): void {
  hintOpen.value = open
  if (!open) homeLinkHintSeen.value = true
}
</script>

<template>
  <span ref="anchor" class="reader-home-link" :class="{ 'reader-home-link--compact': compact }">
    <RouterLink class="reader-home-link__link" :to="homeLocation">
      <CdxIcon :icon="cdxIconHome" size="small" />
      <span>{{ READER_USERNAME }}</span>
    </RouterLink>
  </span>

  <CdxPopover
    :open="hintOpen"
    :anchor="anchor"
    placement="bottom-end"
    title="Your Home is here"
    :icon="cdxIconHome"
    use-close-button
    :primary-action="{ label: 'Got it', actionType: 'progressive' }"
    @update:open="onHintOpen"
    @primary="onHintOpen(false)"
  >
    <!-- Placeholder copy, to refine. -->
    You can go back to your Home from here anytime.
  </CdxPopover>
</template>

<style scoped>
.reader-home-link {
  display: inline-flex;
  margin-inline: var(--spacing-50);
}

/* Vector's header username link (`VectorChromeHeader`), led by a home icon. */
.reader-home-link__link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  color: var(--color-progressive);
  font-size: var(--font-size-small);
  line-height: 1.4;
  text-decoration: none;
}

.reader-home-link__link .cdx-icon {
  color: inherit;
}

.reader-home-link__link:hover {
  text-decoration: underline;
}

/* Minerva: one line in the bar, at its 32px control height. */
.reader-home-link--compact {
  align-items: center;
  min-height: var(--min-size-interactive-pointer);
  margin-inline: var(--spacing-25);
  white-space: nowrap;
}
</style>
