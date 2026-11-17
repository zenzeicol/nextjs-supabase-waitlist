// The two platforms a person can pick when joining the waitlist.
//
// This lives in its own module, not inside lib/waitlist-action.ts, because a
// 'use server' file can only export async functions: the form could not import
// the list from there.
//
// It is a single source on purpose. The same string travels from the form's
// radio button to the insert and from there to the CHECK constraint in the
// migration, and all three must say exactly the same thing. Unlike length
// limits (where the app can be stricter than the database without breaking
// anything), there is no slack here: either the values match or every insert
// fails with 23514 and the person sees "we couldn't save your email".
//
// The label is what is shown on screen; the value is what is stored. They are
// written together so that adding a platform means touching a single list
// (plus the CHECK constraint in a new migration).
export const PLATFORMS = [
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
] as const

export type Platform = (typeof PLATFORMS)[number]['value']

const VALUES: readonly string[] = PLATFORMS.map((platform) => platform.value)

export function isPlatform(value: string): value is Platform {
  return VALUES.includes(value)
}
