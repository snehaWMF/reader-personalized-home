<script setup lang="ts">
/**
 * Minerva's user menu: the outline avatar with a dropdown arrow. Logged out
 * (`loggedOut`), it offers Create account and Log in — the flow's way in on
 * mobile. Logged in, it's led by the username after a home icon — the way back
 * to their Home — then Saved and the menu's usual items, which go nowhere in
 * the prototype. With
 * `hint`, the first time they open an article from the Home, a popover points
 * at it to say so (`homeLinkHintSeen`, shared with Vector's Home link).
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxIcon, CdxMenuButton, CdxPopover } from '@wikimedia/codex'
import type { MenuItemData } from '@wikimedia/codex'
import {
  cdxIconBookmarkList,
  cdxIconDownTriangle,
  cdxIconHome,
  cdxIconLogIn,
  cdxIconLogOut,
  cdxIconUserAdd,
  cdxIconUserAvatarOutline,
  cdxIconUserContributions,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { homeLinkHintSeen } from './readerFlowState'
import { READER_CREATE_ACCOUNT_PATH, READER_HOME_PATH, READER_USERNAME } from './readerHomeContent'

const props = defineProps<{
  /** Point the one-time popover at the menu (on articles opened from the Home). */
  hint?: boolean
  /** The logged-out menu: Create account and Log in. */
  loggedOut?: boolean
}>()

const route = useRoute()
const router = useRouter()

const LOGGED_OUT_ITEMS: MenuItemData[] = [
  { value: 'create-account', label: 'Create account', icon: cdxIconUserAdd },
  { value: 'login', label: 'Log in', icon: cdxIconLogIn },
]

const LOGGED_IN_ITEMS: MenuItemData[] = [
  { value: 'home', label: READER_USERNAME, icon: cdxIconHome },
  { value: 'saved', label: 'Saved', icon: cdxIconBookmarkList },
  { value: 'watchlist', label: 'Watchlist', icon: cdxIconWatchlist },
  { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
  { value: 'logout', label: 'Log out', icon: cdxIconLogOut },
]

const menuItems = computed(() => (props.loggedOut ? LOGGED_OUT_ITEMS : LOGGED_IN_ITEMS))

const selected = ref<string | null>(null)

function onSelect(value: string | number | null): void {
  // A menu, not a choice: nothing stays selected.
  selected.value = null
  const query = preservedQueryFromLocationQuery(route.query)
  if (value === 'home') void router.push({ path: READER_HOME_PATH, query })
  if (value === 'create-account') void router.push({ path: READER_CREATE_ACCOUNT_PATH, query })
  if (value === 'login') void router.push({ path: READER_CREATE_ACCOUNT_PATH, query: { ...query, mode: 'login' } })
}

/* ---- The one-time hint ---- */

const anchor = ref<HTMLElement | null>(null)
const hintOpen = ref(false)

// After the article has had a moment to lay out, so the popover lands on the menu.
onMounted(() => {
  if (!props.hint || props.loggedOut || homeLinkHintSeen.value) return
  window.setTimeout(() => (hintOpen.value = true), 600)
})

function onHintOpen(open: boolean): void {
  hintOpen.value = open
  if (!open) homeLinkHintSeen.value = true
}
</script>

<template>
  <span ref="anchor" class="reader-minerva-user-menu">
    <CdxMenuButton
      :selected="selected"
      :menu-items="menuItems"
      aria-label="User menu"
      @update:selected="onSelect"
    >
      <CdxIcon :icon="cdxIconUserAvatarOutline" />
      <CdxIcon class="reader-minerva-user-menu__caret" :icon="cdxIconDownTriangle" size="x-small" />
    </CdxMenuButton>
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
    You can go back to your Home from this menu anytime.
  </CdxPopover>
</template>

<style scoped>
.reader-minerva-user-menu {
  display: inline-flex;
}

/*
 * The avatar and its arrow sit together in the button (as Vector's user menu).
 * The bar's other buttons are 40px squares with the icon centred, 10px in;
 * this one keeps the avatar 10px in and grows to fit the arrow after it, so the
 * avatar is as far from the bell as the bell is from search.
 */
.reader-minerva-user-menu :deep(.cdx-menu-button > .cdx-button) {
  gap: 0;
  justify-content: flex-start;
  width: auto;
  min-width: 0;
  max-width: none;
  padding-inline: calc((40px - var(--size-icon-medium)) / 2) var(--spacing-25);
}

.reader-minerva-user-menu__caret {
  margin-inline-start: var(--spacing-12);
}
</style>
