"use client"

import { useEffect, useRef } from "react"
import type { TriggerConfig } from "@/lib/types"

/**
 * Observa os gatilhos de exibição configurados (tempo na página, % de
 * rolagem, clique em elemento, intenção de saída) e chama `onFire` na
 * primeira condição satisfeita (comportamento "OR" entre os gatilhos).
 */
export function useSurveyTriggers(
  triggers: TriggerConfig[],
  onFire: () => void,
  enabled: boolean
) {
  const firedRef = useRef(false)
  const onFireRef = useRef(onFire)

  useEffect(() => {
    onFireRef.current = onFire
  }, [onFire])

  useEffect(() => {
    if (!enabled || triggers.length === 0) return
    firedRef.current = false

    const fire = () => {
      if (firedRef.current) return
      firedRef.current = true
      onFireRef.current()
    }

    const cleanups: Array<() => void> = []

    for (const trigger of triggers) {
      if (trigger.type === "immediate") {
        fire()
        continue
      }

      if (trigger.type === "time_on_page") {
        const seconds = trigger.value ?? 10
        const timer = window.setTimeout(fire, seconds * 1000)
        cleanups.push(() => window.clearTimeout(timer))
        continue
      }

      if (trigger.type === "scroll_depth") {
        const threshold = trigger.value ?? 50
        const handler = () => {
          const doc = document.documentElement
          const scrollable = doc.scrollHeight - doc.clientHeight
          const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
          if (pct >= threshold) fire()
        }
        window.addEventListener("scroll", handler, { passive: true })
        cleanups.push(() => window.removeEventListener("scroll", handler))
        continue
      }

      if (trigger.type === "element_click") {
        const selector = trigger.selector
        if (!selector) continue
        const handler = (e: Event) => {
          const target = e.target as Element | null
          if (target?.closest(selector)) fire()
        }
        document.addEventListener("click", handler)
        cleanups.push(() => document.removeEventListener("click", handler))
        continue
      }

      if (trigger.type === "exit_intent") {
        const handler = (e: MouseEvent) => {
          if (e.clientY <= 0) fire()
        }
        document.addEventListener("mouseleave", handler)
        cleanups.push(() => document.removeEventListener("mouseleave", handler))
        continue
      }
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [triggers, enabled])
}
