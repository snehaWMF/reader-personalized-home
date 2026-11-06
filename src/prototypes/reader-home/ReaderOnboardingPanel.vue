<script setup lang="ts">
/**
 * An onboarding screen's frame: a back button (or, with `closable`, a close
 * button) on top with the step count ("1 / 3") across from it, the screen's
 * question, its body, and its actions pinned to the bottom. Vector: an outlined panel
 * centred over the page. Minerva: it fills the window under the header, edge to
 * edge, so the content runs the window's full width.
 */
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose, cdxIconPrevious } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import ReaderSignedInHeader from './ReaderSignedInHeader.vue'

defineProps<{
  title: string
  /** This screen's place in onboarding, shown as "1 / 3"; none outside onboarding. */
  step?: number
  /** A close button rather than back (the first screen). */
  closable?: boolean
  /** The title in the wiki's serif, larger: the greeting. */
  serifTitle?: boolean
}>()

/** The onboarding's screens, for the step count. */
const STEPS = 3

const emit = defineEmits<{ back: []; close: [] }>()
</script>

<template>
  <ChromeWrapper :last-edited-notice="false" :show-footer="false">
    <!-- Onboarding comes after the account is made, so the reader is logged in. -->
    <template #header>
      <ReaderSignedInHeader />
    </template>

    <div class="reader-onboarding">
      <section class="reader-onboarding__panel" aria-labelledby="reader-onboarding-title">
        <div class="reader-onboarding__bar">
          <CdxButton v-if="closable" weight="quiet" icon-only aria-label="Close" @click="emit('close')">
            <CdxIcon :icon="cdxIconClose" />
          </CdxButton>
          <CdxButton v-else weight="quiet" icon-only aria-label="Back" @click="emit('back')">
            <CdxIcon :icon="cdxIconPrevious" />
          </CdxButton>
          <span v-if="step" class="reader-onboarding__step">{{ step }} / {{ STEPS }}</span>
        </div>

        <h1
          id="reader-onboarding-title"
          class="reader-onboarding__title"
          :class="{ 'reader-onboarding__title--serif': serifTitle }"
        >
          {{ title }}
        </h1>

        <div class="reader-onboarding__body">
          <slot />
        </div>

        <div v-if="$slots.actions" class="reader-onboarding__actions">
          <slot name="actions" />
        </div>
      </section>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.reader-onboarding {
  display: flex;
  justify-content: center;
  padding: var(--spacing-200) var(--spacing-100);
}

/* Vector: a Codex card's outline, tall enough that the actions sit well below the content. */
.reader-onboarding__panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  min-height: min(720px, calc(100vh - 160px));
  padding: var(--spacing-100);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
  box-shadow: var(--box-shadow-medium);
}

/* Minerva: the whole window under the 54px header — no outline, no margins around it. */
[data-skin='mobile'] .reader-onboarding {
  padding: 0;
}

[data-skin='mobile'] .reader-onboarding__panel {
  max-width: none;
  min-height: calc(100dvh - 54px);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.reader-onboarding__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-inline-start: calc(-1 * var(--spacing-50));
}

/* Codex Body small, subtle. */
.reader-onboarding__step {
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

/* Codex Heading 3. */
.reader-onboarding__title {
  margin: var(--spacing-300) 0 var(--spacing-75);
  font-family: var(--font-family-base);
  font-size: var(--font-size-x-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-x-large);
  color: var(--color-emphasized);
}

/* The greeting's title, in the wiki's serif headings (Vector's page title). */
.reader-onboarding__title--serif {
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xx-large);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-xx-large);
}

.reader-onboarding__body {
  flex-grow: 1;
}

.reader-onboarding__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: var(--spacing-200);
}
</style>
