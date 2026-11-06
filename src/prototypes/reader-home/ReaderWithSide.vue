<script setup lang="ts">
/**
 * A concept's body with an optional right column (`#side`):
 * on Vector 60/40 — the main column, then the right column — and on Minerva
 * one column, the side's modules after the main ones. `#end` closes the main
 * column on Vector and the whole page on Minerva, so it stays last either way.
 * Without `side`, just the main column and `#end`.
 */
import { computed } from 'vue'

import { globalSkin } from '@/theme'

const props = defineProps<{ side?: boolean }>()

const isMobile = computed(() => globalSkin.value === 'mobile')
const split = computed(() => props.side && !isMobile.value)
</script>

<template>
  <div class="reader-with-side" :class="{ 'reader-with-side--split': split }">
    <div class="reader-with-side__main">
      <slot />
      <slot v-if="!(side && isMobile)" name="end" />
    </div>

    <div v-if="side" class="reader-with-side__side">
      <slot name="side" />
    </div>

    <slot v-if="side && isMobile" name="end" />
  </div>
</template>

<style scoped>
.reader-with-side,
.reader-with-side__main,
.reader-with-side__side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-200);
}

.home-page[data-skin='desktop'] .reader-with-side__main,
.home-page[data-skin='desktop'] .reader-with-side__side {
  gap: var(--spacing-300);
}

/* The side column's modules sit closer than the main column's blocks of cards. */
.home-page[data-skin='desktop'] .reader-with-side__side {
  gap: var(--spacing-200);
}

/* Vector: 60/40, each column's modules from the top. */
.reader-with-side--split {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: start;
  column-gap: var(--spacing-200);
}

@media (max-width: 767px) {
  .reader-with-side--split {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--spacing-200);
  }
}
</style>
