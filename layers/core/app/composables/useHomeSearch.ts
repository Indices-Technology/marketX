import { ref } from 'vue'

// Module-level singleton — shared between HomeLayout's header (the only
// search icon on the mobile home screen) and MinimalHome (which owns the
// richer Find/Verify modal). Lets HomeLayout hand off the header's search
// click to MinimalHome's modal instead of opening its own generic
// SearchOverlay, so there's exactly one search entry point on that screen
// instead of two stacked icons. Same shared-singleton pattern as
// useNavVisibility.
const _searchOpen = ref(false)

export function useHomeSearch() {
  return { searchOpen: _searchOpen }
}
