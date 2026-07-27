import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * クライアントでマウント済みかどうかを返す(SSR時はfalse)。
 * createPortal等をSSR-safeに使うための定番パターンだが、
 * `useEffect(() => setMounted(true), [])` は effect内での同期的setStateとして
 * react-hooks/set-state-in-effect に抵触するため、useSyncExternalStoreで代替する。
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
