/**
 * Header search inside the flow: picking a result (or submitting a search)
 * opens the article on the flow's own page — the logged-in article page, or
 * the logged-out start page — rather than ProtoWiki's article template, which
 * would leave the prototype. Called by the flow's headers, so it covers the
 * desktop search box and Minerva's search overlay alike.
 */
import { useRoute, useRouter } from 'vue-router'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'
import { provideChromeSearchHandlers } from '@/composables/useChromeSearch'

export function useReaderSearch(path: string): void {
  const route = useRoute()
  const router = useRouter()

  function open(title: string | null | undefined): void {
    const trimmed = title?.trim()
    if (!trimmed) return
    void router.push({ path, query: { ...preservedQueryFromLocationQuery(route.query), title: trimmed } })
  }

  provideChromeSearchHandlers({
    onSelect: open,
    onSubmit: ({ title }) => open(title),
  })
}
