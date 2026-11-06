<script setup lang="ts">
/**
 * The Home's title over its tabs — Home (this page), User page and
 * Talk — styled as each skin's page tabs: Vector 2022's under the title rule,
 * Minerva's bold grey strip. User page and Talk are static: they look like
 * tabs but go nowhere.
 *
 * `homeTabs` puts the Home's own views in place of the single Home tab, ahead of
 * User page and Talk; picking one sets `activeTab`. `#tabs-end` goes at the
 * row's far end, as Vector's page tools do (e.g. a settings link) — on Minerva,
 * at the end of the title's line instead.
 */
import { RouterLink, useRoute } from 'vue-router'

defineProps<{
  title: string
  homeTabs?: readonly { value: string; label: string }[]
}>()

const activeTab = defineModel<string>('activeTab')

const route = useRoute()
</script>

<template>
  <header class="home-page-header">
    <h1 class="home-page-header__title">{{ title }}</h1>
    <nav class="home-page-header__tabs" aria-label="Page tabs">
      <template v-if="homeTabs?.length">
        <a
          v-for="tab in homeTabs"
          :key="tab.value"
          href="#"
          class="home-page-header__tab"
          :class="{ 'home-page-header__tab--active': tab.value === activeTab }"
          :aria-current="tab.value === activeTab ? 'page' : undefined"
          @click.prevent="activeTab = tab.value"
        >
          {{ tab.label }}
        </a>
      </template>
      <RouterLink
        v-else
        :to="route.fullPath"
        class="home-page-header__tab home-page-header__tab--active"
        aria-current="page"
      >
        Home
      </RouterLink>
      <a href="#" class="home-page-header__tab" @click.prevent>User page</a>
      <a href="#" class="home-page-header__tab" @click.prevent>Talk</a>
      <span v-if="$slots['tabs-end']" class="home-page-header__tabs-end">
        <slot name="tabs-end" />
      </span>
    </nav>
  </header>
</template>

<style scoped>
/* The gap `SpecialPageWrapper` leaves under its own header. */
.home-page-header {
  position: relative;
  margin-bottom: var(--spacing-100);
}

/*
 * Serif on both skins, as in production: Vector 2022's `#firstHeading`, and on
 * Minerva GrowthExperiments forces it over Minerva's sans special-page titles
 * (`Homepage.less`, `.growthexperiments-homepage-mobile-summary`).
 */
.home-page-header__title {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid var(--border-color-base);
  font-family: var(--font-family-serif);
  font-size: 1.8rem;
  font-weight: var(--font-weight-normal);
  line-height: 1.375;
  color: var(--color-base);
}

.home-page-header__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-100);
  border-bottom: 1px solid var(--border-color-subtle);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
}

/* Vector 2022: blue link tabs; the current one is base-coloured over a 2px rule. */
.home-page-header__tab {
  margin-bottom: -1px;
  padding-block: var(--spacing-25);
  border-bottom: 2px solid transparent;
  color: var(--color-progressive);
  text-decoration: none;
}

.home-page-header__tab:hover {
  text-decoration: underline;
}

/* Pushed to the row's end, centred on the tabs' text. */
.home-page-header__tabs-end {
  display: flex;
  align-items: center;
  margin-inline-start: auto;
}

.home-page-header__tab--active,
.home-page-header__tab--active:hover {
  border-bottom-color: var(--color-base);
  color: var(--color-base);
  text-decoration: none;
}

/* Minerva: GrowthExperiments' 1.7em title with no rule under it, then bold grey tabs. */
[data-skin='mobile'] .home-page-header__title {
  border-bottom: 0;
  font-size: 1.7rem;
}

/*
 * Minerva: the tabs fill a phone's width, so `#tabs-end` moves up to the
 * title's line, at its end, rather than wrapping under the tabs.
 */
[data-skin='mobile'] .home-page-header__tabs-end {
  position: absolute;
  top: 0;
  right: 0;
  height: calc(1.7rem * 1.375);
}

[data-skin='mobile'] .home-page-header__tabs {
  padding-top: var(--spacing-35);
}

[data-skin='mobile'] .home-page-header__tab,
[data-skin='mobile'] .home-page-header__tab:hover {
  color: var(--color-subtle);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

[data-skin='mobile'] .home-page-header__tab--active {
  border-bottom-color: var(--color-subtle);
}
</style>
