/**
 * The reader Home flow's routes and mock content: the example interests and
 * their game rounds' seeds, the random topics, and the welcome question's
 * answers. The reader's saves and collections are in `sampleSaves.ts`.
 */

/** The flow's start: a logged-out reader on an article (`reader-home/index.vue`). */
export const READER_START_PATH = '/start'
export const READER_CREATE_ACCOUNT_PATH = '/create-account'
/** Onboarding, after the greeting: what brings the reader to Wikipedia. */
export const READER_WELCOME_PATH = '/welcome'
/** Onboarding's last screen, and the Home's interests setting (`?from=home`). */
export const READER_INTERESTS_PATH = '/interests'
/** The query that opens the interests screen as the Home's setting rather than an onboarding step. */
export const FROM_HOME_QUERY = { from: 'home' }
/** The personalized Home (`reader-home/home/index.vue`). */
export const READER_HOME_PATH = '/homepage'
/** Articles opened from the Home, with the way back to it in the header (`reader-home/article`). */
export const READER_ARTICLE_PATH = '/article'

/** The reader's name once they have an account: in the header, the greeting and the welcome screen. */
export const READER_USERNAME = 'NewUser'

/** Where a logged-out reader lands: a calm nature article. */
export const START_ARTICLE = 'Sequoia sempervirens'

/** Onboarding, after the account and before the welcome question: a greeting from the baby globe. */
export const READER_GREETING_PATH = '/hello'

export interface ReaderInterest {
  id: string
  /** As it reads in "Related to …". */
  name: string
  /** The article its reads are found from (`morelike:`). */
  seed: string
  /** Cards in its "Related to …" module. */
  count: number
}

/** An article the reader picked on the interests screen, as stored. */
export interface PickedInterest {
  /** The article, which seeds its reads. */
  seed: string
  /** As it reads in "Related to …": the example's label, or the article's title. */
  name: string
  description?: string
  thumbnailUrl?: string
}

/**
 * The interests screen's "Examples": everyday topics, each a little narrower
 * than a whole field (Arctic animals, not animals). Picking one picks `article`,
 * and the Home says "Related to {label}".
 */
export const EXAMPLE_TOPICS = [
  { label: 'Arctic animals', article: 'Arctic fox' },
  { label: 'Japanese cuisine', article: 'Japanese cuisine' },
  { label: 'Black holes', article: 'Black hole' },
  { label: 'Ancient Egypt', article: 'Ancient Egypt' },
  { label: 'Coral reefs', article: 'Coral reef' },
  { label: 'Volcanoes', article: 'Volcano' },
]

/** What the prototype panel's "Picked" picks when the reader hasn't picked any yet: the first three examples. */
export const DEFAULT_PICKED_INTERESTS: PickedInterest[] = EXAMPLE_TOPICS.slice(0, 3).map((topic) => ({
  seed: topic.article,
  name: topic.label,
}))

/**
 * A recently created article for an interest, by its seed article: Daily reads
 * shows one, as "… · Newly created". Picked by hand — Wikipedia's search can't
 * yet find new articles on a topic reliably. Buchdahl star was created on
 * 28 October 2026.
 */
export const NEWLY_CREATED_FOR_INTEREST: Record<string, string> = {
  'Black hole': 'Buchdahl star',
}

/**
 * Daily reads with interests skipped draws each card's topic from here: familiar subjects a
 * general reader would recognize, each an article title.
 */
export const RANDOM_TOPICS = [
  'Octopus',
  'Honey bee',
  'Volcano',
  'Chocolate',
  'Ancient Rome',
  'Aurora',
  'Coffee',
  'Great Pyramid of Giza',
  'Mars',
  'Origami',
  'Tea',
  'Dinosaur',
  'Coral reef',
  'Jazz',
  'Bonsai',
]

/** The welcome screen's answers. */
export const READER_PURPOSES = [
  { id: 'reading', title: 'Reading and exploring', description: 'Learn, save articles, play games.' },
  {
    id: 'editing',
    title: 'Editing and contributing',
    description: 'Fix a typo, update an article, or start a new one.',
  },
  { id: 'both', title: 'A bit of both', description: 'Read, save, and make a few edits too.' },
]
