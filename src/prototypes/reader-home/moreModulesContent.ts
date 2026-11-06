/**
 * Sample data for the modules on the prototype panel's checklist: a knowledge
 * game and fun short videos (the reader's saves and collections are in `sampleSaves.ts`). Static — themed to the mock
 * interests (Arctic animals, Japanese cuisine, black holes) and saved pages
 * (`readerHomeContent.ts`). Thumbnails come live from each article.
 */

/**
 * "What came first?" — each round, two historical events (their articles) and
 * when each happened. Descriptions are written here, without dates: the
 * articles' own short descriptions often give the answer away.
 */
export const KNOWLEDGE_GAME_ROUNDS = [
  {
    a: {
      article: 'Magna Carta',
      description: 'Charter of rights agreed by King John of England',
      year: '1215',
    },
    b: {
      article: 'Black Death',
      description: 'Plague pandemic across Eurasia and North Africa',
      year: '1346',
    },
    first: 'a',
  },
  {
    a: {
      article: 'Fall of the Berlin Wall',
      description: 'The border between East and West Berlin opens',
      year: '1989',
    },
    b: {
      article: 'Apollo 11',
      description: 'First crewed landing on the Moon',
      year: '1969',
    },
    first: 'b',
  },
  {
    a: {
      article: 'Founding of Rome',
      description: 'The legendary beginning of the city of Rome',
      year: '753 BC',
    },
    b: {
      article: 'Great Pyramid of Giza',
      description: 'Largest of the pyramids built in ancient Egypt',
      year: 'c. 2560 BC',
    },
    first: 'b',
  },
] as const

/** One side of a hand-picked "Which came first?" round. */
interface GameSide {
  article: string
  /** Written here, without dates: the articles' own descriptions often give the answer away. */
  description: string
  /** As revealed, after `label`: "1990", "c. 2670 BC". */
  year: string
  /** What the date is: "Launched", "Born"… */
  label: string
  /** For comparing: the year, negative BC. */
  sortYear: number
}

/**
 * Hand-picked "Which came first?" rounds for the interests and saved articles
 * the prototype knows, by their seed article. Each pairs two of the same kind
 * of thing (two eruptions, two telescopes…) dated the same way, with a
 * settled order — when each came to be, not when it was discovered.
 */
export const INTEREST_GAME_ROUNDS: Record<string, { a: GameSide; b: GameSide }[]> = {
  'Arctic fox': [
    {
      a: { article: "Nansen's Fram expedition", description: 'Norwegian attempt to drift across the Arctic Ocean in pack ice', year: '1893', label: 'Set out', sortYear: 1893 },
      b: { article: "Franklin's lost expedition", description: 'British attempt to chart the Northwest Passage, lost in the ice', year: '1845', label: 'Set out', sortYear: 1845 },
    },
    {
      a: { article: 'Arctic National Wildlife Refuge', description: 'Wildlife refuge in northeastern Alaska', year: '1960', label: 'Protected', sortYear: 1960 },
      b: { article: 'Northeast Greenland National Park', description: 'The world’s largest national park', year: '1974', label: 'Protected', sortYear: 1974 },
    },
  ],
  'Japanese cuisine': [
    {
      a: { article: 'Cup Noodles', description: 'Instant ramen sold in its own cup', year: '1971', label: 'First sold', sortYear: 1971 },
      b: { article: 'Nissin Chikin Ramen', description: 'The first instant noodles, made by Nissin', year: '1958', label: 'First sold', sortYear: 1958 },
    },
    {
      a: { article: 'Tsukiji fish market', description: 'Tokyo’s famous wholesale fish market', year: '1935', label: 'Opened', sortYear: 1935 },
      b: { article: 'Toyosu Market', description: 'Tokyo’s wholesale fish and produce market', year: '2018', label: 'Opened', sortYear: 2018 },
    },
  ],
  'Black hole': [
    {
      a: { article: 'James Webb Space Telescope', description: 'Infrared space telescope, Hubble’s successor', year: '2021', label: 'Launched', sortYear: 2021 },
      b: { article: 'Hubble Space Telescope', description: 'Space telescope in low Earth orbit', year: '1990', label: 'Launched', sortYear: 1990 },
    },
    {
      a: { article: 'Uhuru (satellite)', description: 'The first satellite made to map the sky in X-rays', year: '1970', label: 'Launched', sortYear: 1970 },
      b: { article: 'Chandra X-ray Observatory', description: 'NASA’s flagship X-ray space telescope', year: '1999', label: 'Launched', sortYear: 1999 },
    },
  ],
  'Ancient Egypt': [
    {
      a: { article: 'Great Pyramid of Giza', description: 'Largest of the pyramids, built for the pharaoh Khufu', year: 'c. 2560 BC', label: 'Built', sortYear: -2560 },
      b: { article: 'Pyramid of Djoser', description: 'Step pyramid built for the pharaoh Djoser at Saqqara', year: 'c. 2670 BC', label: 'Built', sortYear: -2670 },
    },
    {
      a: { article: 'Ramesses II', description: 'Pharaoh of the Nineteenth Dynasty, known as Ramesses the Great', year: 'c. 1303 BC', label: 'Born', sortYear: -1303 },
      b: { article: 'Tutankhamun', description: 'Boy king whose tomb was found nearly intact', year: 'c. 1341 BC', label: 'Born', sortYear: -1341 },
    },
  ],
  'Coral reef': [
    {
      a: { article: 'Papahānaumokuākea Marine National Monument', description: 'Vast marine reserve around the northwestern Hawaiian Islands', year: '2006', label: 'Protected', sortYear: 2006 },
      b: { article: 'Great Barrier Reef Marine Park', description: 'Marine park protecting much of the Great Barrier Reef', year: '1975', label: 'Protected', sortYear: 1975 },
    },
    {
      a: { article: 'The Structure and Distribution of Coral Reefs', description: 'Charles Darwin’s book on how coral atolls form', year: '1842', label: 'Published', sortYear: 1842 },
      b: { article: 'On the Origin of Species', description: 'Charles Darwin’s book on evolution by natural selection', year: '1859', label: 'Published', sortYear: 1859 },
    },
  ],
  Volcano: [
    {
      a: { article: '1883 eruption of Krakatoa', description: 'Eruption heard thousands of kilometres away, in Indonesia', year: '1883', label: 'Erupted', sortYear: 1883 },
      b: { article: 'Eruption of Mount Vesuvius in 79 AD', description: 'The eruption that buried Pompeii and Herculaneum', year: '79', label: 'Erupted', sortYear: 79 },
    },
    {
      a: { article: '1980 eruption of Mount St. Helens', description: 'Eruption that blew the side off a mountain in Washington state', year: '1980', label: 'Erupted', sortYear: 1980 },
      b: { article: '1991 eruption of Mount Pinatubo', description: 'Eruption in the Philippines that cooled the whole planet', year: '1991', label: 'Erupted', sortYear: 1991 },
    },
  ],
}
/* A saved page sharing its subject's rounds. */
INTEREST_GAME_ROUNDS['Great Barrier Reef'] = INTEREST_GAME_ROUNDS['Coral reef']


/**
 * Short, fun videos about Wikipedia articles — "Fun facts from Wikipedia".
 * Each has a title, how long it runs and a line about it; the article's
 * picture stands in for the video's.
 */
export const SOCIAL_POSTS = [
  {
    title: 'Why Arctic foxes change colour',
    duration: '0:45',
    caption: 'Arctic foxes change coat with the seasons: white in winter, brown in summer.',
    article: 'Arctic fox',
  },
  {
    title: 'How ramen won over Japan',
    duration: '1:10',
    caption: 'How did ramen become one of Japan’s best-loved dishes? The story starts in the 1800s.',
    article: 'Ramen',
  },
  {
    title: 'The first picture of a black hole',
    duration: '0:58',
    caption: 'In 2019, people saw a black hole for the first time. Here’s what that image shows.',
    article: 'Messier 87',
  },
  {
    title: 'Three hearts, blue blood: the octopus',
    duration: '0:52',
    caption: 'An octopus has three hearts and blue blood — and each arm can taste what it touches.',
    article: 'Octopus',
  },
]

/** Community updates: one announcement for readers here to edit too. The image is the Wikimedia logo (its article's picture). */
export const COMMUNITY_UPDATE = {
  imageArticle: 'Wikimedia Foundation',
  headline: 'Join #1Lib1Ref: add one reference this month',
  text:
    'Librarians and readers around the world are adding reliable sources to Wikipedia. ' +
    'Pick an article that needs a citation and add one in a few minutes.',
  linkLabel: 'Find articles that need citations',
}
