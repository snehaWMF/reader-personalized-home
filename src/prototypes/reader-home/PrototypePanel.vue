<script setup lang="ts">
/**
 * Prototype control, not part of the design: a yellow "Prototype settings" chip
 * pinned to the bottom-right corner, opening a panel that sets what the Home shows. Mainly a checklist of
 * its modules (`HOME_MODULES`) in groups by type (`HOME_MODULE_GROUPS`), so they can be turned on one by one — Daily
 * reads alone is on for a new account. Below, closed by
 * default, "Advanced settings": whether they picked interests, and whether
 * they're here for reading or editing too.
 */
import { computed, ref } from 'vue'
import { CdxAccordion, CdxCheckbox, CdxIcon, CdxPopover, CdxToggleButtonGroup } from '@wikimedia/codex'
import { cdxIconLabFlask } from '@wikimedia/codex-icons'

import {
  editingFirst,
  enabledModules,
  HOME_MODULE_GROUPS,
  HOME_MODULES,
  REQUIRED_HOME_MODULES,
  personalized,
  readerPurpose,
  setPersonalized,
  wantsEditing,
} from './readerFlowState'

const anchor = ref<HTMLElement | null>(null)
const open = ref(false)

const interestsState = computed({
  get: () => (personalized.value ? 'picked' : 'skipped'),
  set: (value: string) => setPersonalized(value === 'picked'),
})

/* The welcome screen's answers: reading (or skipped), a bit of both, or editing. */
const purposeState = computed({
  get: () => (editingFirst.value ? 'editing' : wantsEditing.value ? 'both' : 'reading'),
  set: (value: string) => {
    readerPurpose.value = value
  },
})

/* The checklist in the panel's groups (short form, curation, games…), Daily reads first. */
const moduleGroups = HOME_MODULE_GROUPS.map((group) => ({
  ...group,
  modules: HOME_MODULES.filter((module) => module.group === group.id),
}))

/* Kept in the Home's order, whatever order they're ticked in; Daily reads always on. */
const checkedModules = computed({
  get: () => [...new Set([...REQUIRED_HOME_MODULES, ...enabledModules.value])],
  set: (ids) => {
    enabledModules.value = HOME_MODULES.map((module) => module.id).filter(
      (id) => ids.includes(id) || REQUIRED_HOME_MODULES.includes(id),
    )
  },
})
</script>

<template>
  <div class="prototype-panel">
    <span ref="anchor">
      <button
        type="button"
        class="prototype-panel__chip"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="open = !open"
      >
        <CdxIcon :icon="cdxIconLabFlask" size="small" />
        Prototype settings
      </button>
    </span>

    <CdxPopover
      v-model:open="open"
      :anchor="anchor"
      placement="top-end"
      title="Prototype settings"
      use-close-button
    >
      <fieldset class="prototype-panel__modules">
        <legend class="prototype-panel__label">Modules on the Home</legend>
        <div v-for="group in moduleGroups" :key="group.id ?? 'own'" class="prototype-panel__group">
          <span v-if="group.label" class="prototype-panel__group-label">{{ group.label }}</span>
          <CdxCheckbox
            v-for="module in group.modules"
            :key="module.id"
            v-model="checkedModules"
            :input-value="module.id"
            :disabled="REQUIRED_HOME_MODULES.includes(module.id)"
          >
            {{ module.label }}
          </CdxCheckbox>
        </div>
      </fieldset>

      <CdxAccordion class="prototype-panel__settings" separation="none">
        <template #title>Advanced settings</template>
        <div class="prototype-panel__rows">
          <div class="prototype-panel__row">
            <span class="prototype-panel__label">Interests</span>
            <CdxToggleButtonGroup
              v-model="interestsState"
              :buttons="[
                { value: 'picked', label: 'Picked' },
                { value: 'skipped', label: 'Skipped' },
              ]"
            />
          </div>

          <div class="prototype-panel__row">
            <span class="prototype-panel__label">Here for</span>
            <CdxToggleButtonGroup
              v-model="purposeState"
              :buttons="[
                { value: 'reading', label: 'Reading' },
                { value: 'both', label: 'Both' },
                { value: 'editing', label: 'Editing' },
              ]"
            />
          </div>
        </div>
      </CdxAccordion>
    </CdxPopover>
  </div>
</template>

<style scoped>
.prototype-panel {
  position: fixed;
  right: var(--spacing-100);
  bottom: var(--spacing-100);
  z-index: 10;
}

/*
 * PROTOWIKI+ A clickable yellow chip, so it reads as a prototype control rather
 * than the design. Codex's yellow InfoChip (status "warning") can't be clicked,
 * so this is a button in its colours, raised off the page.
 */
.prototype-panel__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  padding: var(--spacing-25) var(--spacing-75);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-warning);
  border-radius: var(--border-radius-pill);
  background-color: var(--background-color-warning-subtle);
  box-shadow: var(--box-shadow-medium);
  color: var(--color-base);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
  cursor: pointer;
}

.prototype-panel__chip:hover {
  background-color: var(--background-color-warning-subtle--hover, var(--background-color-warning-subtle));
  border-color: var(--border-color-warning);
  filter: brightness(0.97);
}

.prototype-panel__chip:focus-visible {
  outline: var(--border-width-thick) var(--border-style-base) var(--border-color-progressive--focus);
  outline-offset: 1px;
}

.prototype-panel__chip .cdx-icon {
  color: inherit;
}

.prototype-panel__modules {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.prototype-panel__group + .prototype-panel__group {
  margin-top: var(--spacing-75);
}

.prototype-panel__group .cdx-checkbox:last-child {
  margin-bottom: 0;
}

/* Codex Body small, subtle: a group's name over its modules. */
.prototype-panel__group-label {
  display: block;
  margin-bottom: var(--spacing-25);
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

.prototype-panel__modules legend {
  margin-bottom: var(--spacing-50);
  padding: 0;
}

/* Out of the way: a divider above, Codex Accordion's own closed header. */
.prototype-panel__settings {
  margin-top: var(--spacing-100);
  border-top: var(--border-width-base) var(--border-style-base) var(--border-color-subtle);
}

.prototype-panel__rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.prototype-panel__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-25);
}

/* Codex Body small bold. */
.prototype-panel__label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
}
</style>
