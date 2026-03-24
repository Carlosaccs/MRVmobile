/* ==========================================================================
   v139.7 - JS BLINDADO (COM MODO DE SEGURANÇA)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; 

// 1. CARREGAR DADOS
async function carregarPlanilha() {
    console.log("🔄 Buscando Planilha...");
    try {
        const res = await fetch(URL_PLANILHA);
        if (!res.ok) throw new Error("Erro fetch");
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        
        linhas.slice(1).forEach(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 5) {
                const id = c[0].replace(/"/g, '').trim().toLowerCase();
                window.bancoDados[id] = {
                    nomeCurto: c[3]?.replace(/"/g, '').trim() || "",
                    estoque: c[5]?.replace(/"/g, '').trim() || "0",
                    statusObra: c[11]?.replace(/"/g, '').trim() || "N/A"
                };
            }
        });
        console.log("✅ Dados carregados");
    } catch (e) {
        console.warn("⚠️ Planilha offline - Usando modo offline");
    }
    atualizarVisualizacao();
}

// 2. DESENHAR MAPA (COM MODO DE EMERGÊNCIA)
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.innerHTML = "";

    // MODO DE EMERGÊNCIA: Se os dados do mapa não existirem, desenha um quadrado de teste
    if (!dados) {
        container.innerHTML = `<div style="color:red; font-size:10px;">Erro: Dados de ${targetId} não encontrados no arquivo mapas_dados.js</div>`;
        const svgEmergencia = document.createElementNS(svgNS, "svg");
        svgEmergencia.setAttribute("viewBox", "0 0 100 100");
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("width", "80"); rect.setAttribute("height", "80");
        rect.setAttribute("x", "10"); rect.setAttribute("y", "10");
        rect.setAttribute("fill", "#00713a");
        svgEmergencia.appendChild(rect);
        container.appendChild(svgEmergencia);
        return;
    }

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    const g = document.createElementNS(svgNS, "g");
    if(dados.transform) g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.style.fill = (pData.class === "commrv") ? "#00713a" : "#ccc";
        path.style.stroke = "#fff";
        path.style.strokeWidth = "1";

        if (!ehMinimizado) {
            path.onclick = () => {
                document.getElementById('nome-imovel').innerText = pData.name || pData.id;
                const info = window.bancoDados[pData.id.toLowerCase()];
                if(info) {
                    document.getElementById('detalhes-imovel').innerHTML = `<p>Estoque: ${info.estoque}</p>`;
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

// 3. FUNÇÕES DE CONTROLE
function atualizarVisualizacao() {
    // Verifica se as variáveis globais existem no outro arquivo
    const dadosGSP = (typeof MAPA_GSP !== 'undefined') ? MAPA_GSP : null;
    const dadosInterior = (typeof MAPA_INTERIOR !== 'undefined') ? MAPA_INTERIOR : null;

    if (mapaAtivo === "GSP") {
        desenharMapa(dadosGSP, "mapa-container", false);
        desenharMapa(dadosInterior, "mapa-minimizado", true);
    } else {
        desenharMapa(dadosInterior, "mapa-container", false);
        desenharMapa(dadosGSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    atualizarVisualizacao();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
        document.exitFullscreen();
    }
}

function toggleMenuLateral() {
    alert("Menu lateral em desenvolvimento");
}

// INICIAR
window.onload = carregarPlanilha;
