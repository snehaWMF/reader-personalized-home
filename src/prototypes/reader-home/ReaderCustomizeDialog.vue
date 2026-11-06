<script setup lang="ts" generic="T extends string">
/**
 * A module's "Customize" dialog (Daily reads, Wikipedia in pictures): a
 * checkbox per source it can draw on, with a line about each — or, when one
 * isn't available yet, why. Opens on the sources now on; Save emits the ones
 * ticked.
 */
import { ref, watch } from 'vue'
import { CdxCheckbox, CdxDialog } from '@wikimedia/codex'

export interface CustomizeSource<V extends string> {
  value: V
  label: string
  description: string
  /** Shown instead of the description while it's unavailable. */
  unavailable?: string
  available: boolean
}

const props = defineProps<{
  title: string
  subtitle: string
  sources: readonly CustomizeSource<T>[]
  /** The sources on now; the dialog opens with these ticked. */
  selected: readonly T[]
}>()

const emit = defineEmits<{ save: [selected: T[]] }>()

const open = defineModel<boolean>('open', { default: false })

const draft = ref<T[]>([])
watch(open, (isOpen) => {
  if (isOpen) draft.value = [...props.selected]
})

function save(): void {
  emit('save', [...draft.value])
  open.value = false
}
</script>

<template>
  <CdxDialog
    v-model:open="open"
    :title="title"
    :subtitle="subtitle"
    use-close-button
    :primary-action="{ label: 'Save', actionType: 'progressive' }"
    :default-action="{ label: 'Cancel' }"
    @primary="save"
    @default="open = false"
  >
    <CdxCheckbox
      v-for="source in sources"
      :key="source.value"
      v-model="draft"
      :input-value="source.value"
      :disabled="!source.available"
    >
      {{ source.label }}
      <template #description>
        {{ source.available ? source.description : source.unavailable }}
      </template>
    </CdxCheckbox>
  </CdxDialog>
</template>
