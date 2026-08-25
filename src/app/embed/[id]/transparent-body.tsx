"use client"

import { useEffect } from "react"

/**
 * A tag <body> é definida uma única vez no layout raiz (compartilhado com
 * /admin e /demo, que precisam de um fundo real). Em vez de duplicar toda a
 * árvore de layouts só para esta rota, esse componente adiciona uma classe
 * que zera o fundo apenas enquanto a página /embed/[id] está montada — o que
 * é exatamente o caso quando ela é carregada dentro do <iframe> injetado no
 * site do cliente.
 */
export function TransparentBody() {
  useEffect(() => {
    document.documentElement.classList.add("mp-embed")
    document.body.classList.add("mp-embed")
    return () => {
      document.documentElement.classList.remove("mp-embed")
      document.body.classList.remove("mp-embed")
    }
  }, [])

  return null
}
