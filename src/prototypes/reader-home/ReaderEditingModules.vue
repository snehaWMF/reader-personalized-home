<script setup lang="ts">
/**
 * The right-column modules a reader here to edit too gets ("A bit of both" or
 * "Editing and contributing"), in every concept: Community updates, Your impact
 * and Your mentor — the last two the Home template's own. Their Suggested
 * edits stays in the main column (`ReaderSuggestedEdits`).
 */
import { computed } from 'vue'

import HomeImpact from '../template-home/HomeImpact.vue'
import HomeMentor from '../template-home/HomeMentor.vue'
import HomeModuleMenu from '../template-home/HomeModuleMenu.vue'
import HomeSectionFrame from '../template-home/HomeSectionFrame.vue'
import { MENTOR_CONTENT } from '../template-home/mentorContent'
import { useHomeMentor } from '../template-home/useHomeMentor'
import ReaderCommunityUpdates from './ReaderCommunityUpdates.vue'

/* The mentor's title and menu follow its state, as on the Home template. */
const { isAssigned, assign, optOut } = useHomeMentor()
const mentorTitle = computed(() =>
  isAssigned.value ? MENTOR_CONTENT.assigned.title : MENTOR_CONTENT.unassigned.title,
)
const mentorMenu = computed(() => ({
  items: isAssigned.value
    ? [{ value: 'opt-out', label: 'Opt out of mentorship' }]
    : [{ value: 'get-mentor', label: MENTOR_CONTENT.unassigned.action }],
  footer: { value: 'about', label: 'About mentors' },
}))

function onMentorMenuSelect(value: string | number): void {
  if (value === 'opt-out') optOut()
  if (value === 'get-mentor') assign()
}
</script>

<template>
  <HomeSectionFrame id="community-updates" title="Community updates">
    <ReaderCommunityUpdates />
  </HomeSectionFrame>

  <HomeSectionFrame id="impact" title="Your impact">
    <HomeImpact />
  </HomeSectionFrame>

  <HomeSectionFrame id="mentor" :title="mentorTitle">
    <template #actions>
      <HomeModuleMenu :menu="mentorMenu" @select="onMentorMenuSelect" />
    </template>
    <HomeMentor />
  </HomeSectionFrame>
</template>
