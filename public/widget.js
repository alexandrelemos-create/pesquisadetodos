/**
 * Micropesquisa — snippet de instalação do widget.
 *
 * Cole isto no <head> (ou antes de </body>) das páginas do seu site onde a
 * pesquisa deve poder aparecer:
 *
 *   <script
 *     src="https://SEU-DOMINIO-DO-MICROPESQUISA.com/widget.js"
 *     data-campaign-id="ID_DA_CAMPANHA"
 *     async
 *   ></script>
 *
 * O ID da campanha aparece na URL do painel admin, em
 * /admin/campaigns/ID_DA_CAMPANHA/... — ou no botão "Pré-visualizar widget".
 *
 * O script não bloqueia cliques no restante da página: ele cria um
 * <iframe> transparente que só ocupa espaço (e só recebe cliques) na área
 * exata onde o widget está desenhado, e cresce/encolhe dinamicamente
 * conforme o widget muda de estado (escondido → card recolhido → pesquisa
 * expandida).
 */
(function () {
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script")
      return scripts[scripts.length - 1]
    })()

  var campaignId = currentScript.getAttribute("data-campaign-id")
  if (!campaignId) {
    console.error(
      "[Micropesquisa] Adicione o atributo data-campaign-id na tag <script> do widget.js."
    )
    return
  }

  var apiBase =
    currentScript.getAttribute("data-api-base") ||
    new URL(currentScript.src, window.location.href).origin

  var offsetBottom = currentScript.getAttribute("data-offset-bottom") || "20px"
  var offsetRight = currentScript.getAttribute("data-offset-right") || "20px"

  function init() {
    var iframe = document.createElement("iframe")
    iframe.src = apiBase + "/embed/" + encodeURIComponent(campaignId)
    iframe.title = "Pesquisa"
    iframe.setAttribute("scrolling", "no")
    iframe.setAttribute("frameborder", "0")
    iframe.style.position = "fixed"
    iframe.style.bottom = offsetBottom
    iframe.style.right = offsetRight
    iframe.style.width = "0px"
    iframe.style.height = "0px"
    iframe.style.border = "none"
    iframe.style.background = "transparent"
    iframe.style.zIndex = "2147483000"
    iframe.style.pointerEvents = "none"
    iframe.style.colorScheme = "normal"

    document.body.appendChild(iframe)

    window.addEventListener("message", function (event) {
      var data = event.data
      if (!data || data.source !== "micropesquisa-widget") return
      if (String(data.campaignId) !== String(campaignId)) return
      var w = Number(data.width) || 0
      var h = Number(data.height) || 0
      iframe.style.width = w + "px"
      iframe.style.height = h + "px"
      iframe.style.pointerEvents = w > 0 && h > 0 ? "auto" : "none"
    })
  }

  if (document.body) {
    init()
  } else {
    document.addEventListener("DOMContentLoaded", init)
  }
})()
