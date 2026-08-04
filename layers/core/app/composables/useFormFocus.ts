import { nextTick } from 'vue'

/**
 * Scroll to and focus the first field that has a validation error.
 *
 * Forms in the app submit through custom `@click` handlers (not native submit),
 * so the browser never scrolls to the offending input on its own — the seller
 * is left wondering why "Save" did nothing. This finds the first errored field,
 * centres it in the viewport, and focuses its control.
 *
 * Fields are located by a `data-field="<key>"` attribute on (or wrapping) the
 * control, which lets it reach across child components without ref plumbing.
 */
export function useFormFocus() {
  /**
   * @param orderedKeys field keys in visual/DOM order (top-to-bottom)
   * @param errors      map of field key → error message (falsy = no error)
   * @param root        optional scope to search within (defaults to document)
   */
  async function focusFirstError(
    orderedKeys: string[],
    errors: Record<string, unknown>,
    root?: HTMLElement | null,
  ): Promise<boolean> {
    const firstKey = orderedKeys.find((k) => !!errors[k])
    if (!firstKey) return false

    await nextTick()
    const scope: ParentNode = root ?? document
    const anchor = scope.querySelector<HTMLElement>(
      `[data-field="${firstKey}"]`,
    )
    if (!anchor) return false

    anchor.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Focus the control itself, or the first focusable control inside the anchor.
    const focusable = anchor.matches('input, textarea, select')
      ? anchor
      : anchor.querySelector<HTMLElement>('input, textarea, select, [tabindex]')
    focusable?.focus({ preventScroll: true })

    return true
  }

  return { focusFirstError }
}
