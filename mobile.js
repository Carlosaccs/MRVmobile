/* ==========================================================================
   1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ========================================================================== 
*/
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';
let mapaAtivo = "GSP";

/* ==========================================================================
   2. CONEXÃO COM O BANCO DE DADOS (PLANILHA)
   ========================================================================== 
*/
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split('\n').slice(1);
        window.bancoDados = {};
        linhas.forEach(l => {
            const c = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 5) return;
            const id = c[0].replace(/"/g, '').trim();
            window.bancoDados[id] = {
                nome: c[3]?.replace(/"/g, '').trim() || "Residencial",
                estoque: c[5]?.replace(/"/g, '').trim() || "0"
            };
        });
    } catch (e) { console.warn("Planilha..."); }
}

/* ==========================================================================
   3. RENDERIZAÇÃO DO MAPA (DESENHO DOS PATHS)
   ========================================================================== 
*/
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    /* ==========================================================================
       3.1 AJUSTE DINÂMICO DE POSIÇÃO E ZOOM (v121)
       ========================================================================== 
       Controlamos o zoom isolado aqui para não impactar o mapa oposto.
    */
    if (!ehMinimizado) {
        if (mapaAtivo === "INTERIOR") {
            // INTERIOR (SP): Centralizado e Ampliado v121
            // Mantém a Grande SP na posição original aprovada
            svg.style.marginRight = "50%"; 
            svg.style.marginLeft = "-100px";
            // ZOOM v121: Aplica scale(1.15) apenas ao Interior para ele crescer 15%
            svg.style.transform = "scale(1.15)"; 
        } else {
            // GRANDE SP (GSP): Mantém a configuração da v116/120 (está ótima)
            svg.style.marginRight = "35%"; 
            svg.style.marginLeft = "-70px";
            // Reseta o zoom
            svg.style.transform = "scale(1)"; 
        }
    }

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    // 3.2 Loop de criação dos polígonos
    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.8";

        // 3.3 Interação de Clique
        if (!ehMinimizado) {
            path.setAttribute('data-fill-original', corBase);
            path.onclick = () => {
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-fill-original');
                });
                path.style.fill = "#ffb347";
                const info = window.bancoDados ? window.bancoDados[pData.id] : null;
                document.getElementById('nome-imovel').innerText = info ? info.nome : pData.id.toUpperCase();
                document.getElementById('detalhes-imovel').innerText = info ? `Unidades: ${info.estoque}` : "Toque em um residencial verde.";
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

/* ==========================================================================
   4. LOGICA DE TROCA DE MAPAS (BOTÃO MINIATURA)
   ========================================================================== 
*/
function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
    desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
}

/* ==========================================================================
   5. INICIALIZAÇÃO DO SISTEMA
   ========================================================================== 
*/
window.onload = async () => {
    await carregarPlanilha();
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(MAPA_GSP, "mapa-container", false);
        desenharMapa(MAPA_INTERIOR, "mapa-minimizado", true);
        document.getElementById('mapa-minimizado').onclick = trocarMapas;
    }
};
