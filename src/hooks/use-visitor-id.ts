"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "mp_visitor_id"

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(null)

  useEffect(() => {
    // Sincroniza com o localStorage (sistema externo só disponível no
    // navegador) — precisa ser um efeito para não quebrar a renderização no
    // servidor nem causar mismatch de hidratação.
    try {
      let id = window.localStorage.getItem(STORAGE_KEY)
      if (!id) {
        id = generateId()
        window.localStorage.setItem(STORAGE_KEY, id)
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisitorId(id)
    } catch {
      setVisitorId(generateId())
    }
  }, [])

  return visitorId
}
