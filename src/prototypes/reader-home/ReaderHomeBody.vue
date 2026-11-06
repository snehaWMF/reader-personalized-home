<script setup lang="ts">
/**
 * The Home's body, under its greeting: "Your daily mix" and the date over everything, then one main column, every module full
 * width, with each module's cards two to a row on Vector (one on Minerva).
 * Which modules show is the prototype panel's checklist (`enabledModules`);
 * their order is fixed:
 *
 * 1. The reader's own (`ReaderForYou`): Daily reads, Inside your saved
 *    articles, Challenge your knowledge.
 * 2. The community's: Community curated, Most read on Wikipedia this week,
 *    and Fun facts from Wikipedia last.
 *
 * A reader here to edit too also gets Suggested edits in the main column and a
 * right column for Community updates, Your impact and Your mentor
 * (`ReaderEditingModules`).
 */
import ReaderCommunityCards from './ReaderCommunityCards.vue'
import ReaderCommunityCurated from './ReaderCommunityCurated.vue'
import ReaderEditingModules from './ReaderEditingModules.vue'
import ReaderForYou from './ReaderForYou.vue'
import ReaderSocialPosts from './ReaderSocialPosts.vue'
import ReaderWithSide from './ReaderWithSide.vue'
import { moduleOn, wantsEditing } from './readerFlowState'

/** "Friday, November 6": the day the mix is for. */
const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(
  new Date(),
)
</script>

<template>
  <!-- Everything below is today's mix: the modules change each day. -->
  <div class="reader-home-body__today">
    <h2 class="reader-home-body__today-title">Your daily mix</h2>
    <p class="reader-home-body__today-date">{{ todayLabel }}</p>
  </div>

  <ReaderWithSide :side="wantsEditing" class="reader-home-body reader-two-up">
    <ReaderForYou no-featured>
      <template #after-own>
        <ReaderCommunityCurated v-if="moduleOn('community-curated')" />
      </template>
    </ReaderForYou>

    <ReaderCommunityCards v-if="moduleOn('top-reads')" />

    <template #side>
      <ReaderEditingModules />
    </template>

    <!-- Last on the Home. -->
    <template #end>
      <ReaderSocialPosts v-if="moduleOn('social-posts')" />
    </template>
  </ReaderWithSide>
</template>

<style scoped>
/*
 * A small label and the date, not another heading — so it reads as the start
 * of the day's content rather than one more module title.
 */
.reader-home-body__today {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
  margin-top: var(--spacing-150);
}

/*
 * Codex Body small bold, subtle — in capitals, an eyebrow label over the day's modules.
 * CODEX+ Codex has no all-caps text style; the letter spacing keeps capitals readable.
 */
.reader-home-body__today-title {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-subtle);
  white-space: nowrap;
}

/* Codex Body small, subtle. */
.reader-home-body__today-date {
  margin: 0;
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
  white-space: nowrap;
}

.reader-home-body__today-date::before {
  content: '·';
  margin-inline-end: var(--spacing-50);
}

/* The day's modules start a step below "Your daily mix", on both skins. */
.reader-home-body {
  margin-top: var(--spacing-150);
}
</style>
