import { ref } from 'vue'

// Module-level singleton — shared between HomeLayout and any page that needs
// to sync UI with the mobile nav's show/hide animation (e.g. MinimalHome
// hiding both while its hero slide is active).
const _mobileNavVisible = ref(true)
const _bottomNavVisible = ref(true)

export function useNavVisibility() {
  return {
    mobileNavVisible: _mobileNavVisible,
    bottomNavVisible: _bottomNavVisible,
  }
}
