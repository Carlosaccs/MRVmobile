/* ==========================================================================
   BLOCO 100: CONFIGURAÇÕES E SELETORES
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "http://www.w3.org/2000/svg";

/* ==========================================================================
   BLOCO 110: INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
    // Iniciamos com a Grande SP por padrão
    renderizarMapa(MAPA_GSP);
};

/* ==========================================================================
   BLOCO 120: MOTOR DE RENDERIZAÇÃO (ENGINE)
   ========================================================================== */
function renderizarMapa(dadosEstado) {
    if (!dadosEstado) return;

    // Criar o SVG
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dadosEstado.viewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");

    // Grupo principal com a transformação de escala/posicionamento
    const grupoPrincipal = document.createElementNS(svgNS, "g");
    grupoPrincipal.setAttribute("transform", dadosEstado.transform);

    // Iterar pelos caminhos (paths) do arquivo mapa-SP.js
    dadosEstado.paths.forEach(pathData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathData.d);
        path.setAttribute("id", pathData.id);
        path.setAttribute("class", pathData.class || "regiao-padrao");
        
        // Estilo básico para visualização inicial
        path.style.fill = pathData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.style.cursor = "pointer";

        // Evento de clique para atualizar a ficha técnica (30%)
        path.onclick = () => atualizarFicha(pathData);

        grupoPrincipal.appendChild(path);
    });

    svg.appendChild(grupoPrincipal);
    
    // Limpar container e inserir o novo mapa
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

/* ==========================================================================
   BLOCO 130: INTERAÇÃO (FICHA TÉCNICA)
   ========================================================================== */
function atualizarFicha(item) {
    fichaNome.innerText = item.name;
    fichaDetalhes.innerHTML = `
        <p><strong>ID:</strong> ${item.id}</p>
        <p><strong>Status:</strong> ${item.class === "semmrv" ? "Sem empreendimentos" : "Com unidades disponíveis"}</p>
    `;
    
    // Feedback visual simples
    console.log("Selecionado:", item.name);
}
