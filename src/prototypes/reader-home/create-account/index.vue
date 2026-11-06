<script setup lang="ts">
/**
 * The flow's mock account page — Create account, or Log in with `?mode=login`.
 * Laid out like Special:CreateAccount: username (with its "Avoid using your
 * real name." note), password and its confirmation (each with a show/hide
 * toggle), an optional email, and the hCaptcha line under the button.
 *
 * Nothing is sent anywhere: submitting makes the Mock user a New user, then a
 * new account is greeted and onboarded, and a returning one goes straight to
 * its personalized Home.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxField, CdxIcon, CdxTextInput, CdxTooltip } from '@wikimedia/codex'
import { cdxIconEye, cdxIconEyeClosed, cdxIconHelpNotice } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { useConfig } from '@/composables/useConfig'

import {
  DEFAULT_HOME_MODULES,
  enabledModules,
  homeLinkHintSeen,
  interestsPromptDismissed,
  pickedInterests,
  readerPurpose,
  savedSnapshot,
  unsavedArticles,
  setPersonalized,
} from '../readerFlowState'
import ReaderStartHeader from '../ReaderStartHeader.vue'
import { READER_GREETING_PATH, READER_HOME_PATH } from '../readerHomeContent'

// A short address, without the folder's name repeating the repository's.
definePage({ path: '/create-account' })

const vTooltip = CdxTooltip

const route = useRoute()
const router = useRouter()
const { user } = useConfig()

const isLogin = computed(() => route.query.mode === 'login')

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const email = ref('')

const showPassword = ref(false)
const showConfirm = ref(false)

function submit(): void {
  user.value = 'new'
  // A new account picks from scratch; a returning reader comes back to their picks.
  homeLinkHintSeen.value = false
  interestsPromptDismissed.value = false
  if (isLogin.value) {
    setPersonalized(true)
  } else {
    pickedInterests.value = []
    readerPurpose.value = null
    // A brand-new account has nothing saved yet: just the default modules.
    enabledModules.value = [...DEFAULT_HOME_MODULES]
    savedSnapshot.value = null
    unsavedArticles.value = []
  }
  void router.push({
    path: isLogin.value ? READER_HOME_PATH : READER_GREETING_PATH,
    query: preservedQueryFromLocationQuery(route.query),
  })
}
</script>

<template>
  <ChromeWrapper :last-edited-notice="false">
    <template #header>
      <ReaderStartHeader />
    </template>

    <SpecialPageWrapper :title="isLogin ? 'Log in' : 'Create account'" class="reader-account">
      <form class="reader-account__form" @submit.prevent="submit">
        <CdxField>
          <template #label>Username</template>
          <template v-if="!isLogin" #description>
            <span class="reader-account__note">
              Avoid using your real name.
              <span
                v-tooltip="'Your username is public: it shows on everything you do on Wikipedia.'"
                class="reader-account__help"
                tabindex="0"
                aria-label="Why?"
              >
                <CdxIcon :icon="cdxIconHelpNotice" size="small" />
              </span>
            </span>
          </template>
          <CdxTextInput v-model="username" placeholder="Enter your username" autocomplete="off" />
        </CdxField>

        <CdxField>
          <template #label>Password</template>
          <!-- CODEX+ CdxTextInput: no show/hide for passwords. A quiet icon button sits in its end-icon spot. -->
          <div class="reader-account__password">
            <CdxTextInput
              v-model="password"
              :input-type="showPassword ? 'text' : 'password'"
              :placeholder="isLogin ? 'Enter your password' : 'Enter a password'"
              autocomplete="off"
            />
            <CdxButton
              type="button"
              weight="quiet"
              size="small"
              class="reader-account__reveal"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <CdxIcon :icon="showPassword ? cdxIconEyeClosed : cdxIconEye" />
            </CdxButton>
          </div>
        </CdxField>

        <template v-if="!isLogin">
          <CdxField>
            <template #label>Confirm password</template>
            <div class="reader-account__password">
              <CdxTextInput
                v-model="confirmPassword"
                :input-type="showConfirm ? 'text' : 'password'"
                placeholder="Enter password again"
                autocomplete="off"
              />
              <CdxButton
                type="button"
                weight="quiet"
                size="small"
                class="reader-account__reveal"
                :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                @click="showConfirm = !showConfirm"
              >
                <CdxIcon :icon="showConfirm ? cdxIconEyeClosed : cdxIconEye" />
              </CdxButton>
            </div>
          </CdxField>

          <CdxField optional>
            <template #label>Email address</template>
            <CdxTextInput
              v-model="email"
              input-type="email"
              placeholder="Enter your email address"
              autocomplete="off"
            />
          </CdxField>
        </template>

        <CdxButton type="submit" action="progressive" weight="primary" size="large" class="reader-account__submit">
          {{ isLogin ? 'Log in' : 'Create your account' }}
        </CdxButton>

        <p v-if="!isLogin" class="reader-account__captcha">
          This site is protected by hCaptcha and its
          <a href="#" @click.prevent>Privacy Policy</a> and
          <a href="#" @click.prevent>Terms of Service</a> apply.
        </p>
      </form>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
/* Special:CreateAccount's form column. */
.reader-account__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
  max-width: 480px;
  padding-top: var(--spacing-50);
}

.reader-account__form .cdx-field {
  margin: 0;
}

/* CODEX+ CdxTextInput: capped narrower by default; here it spans the form. */
.reader-account__form .cdx-text-input {
  max-width: none;
}

.reader-account__note {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
}

.reader-account__help {
  display: inline-flex;
  cursor: help;
}

.reader-account__help .cdx-icon {
  color: var(--color-base);
}

.reader-account__password {
  position: relative;
}

/* Room for the toggle, so typed text never runs under it. */
.reader-account__password :deep(.cdx-text-input__input) {
  padding-inline-end: var(--spacing-250);
}

.reader-account__reveal {
  position: absolute;
  top: 50%;
  inset-inline-end: var(--spacing-25);
  transform: translateY(-50%);
}

.reader-account__submit {
  width: 100%;
  max-width: none;
}

/* Codex Body, with its links underlined like the page's legal line. */
.reader-account__captcha {
  margin: calc(-1 * var(--spacing-50)) 0 0;
  color: var(--color-base);
}

.reader-account__captcha a {
  color: inherit;
  text-decoration: underline;
}
</style>
