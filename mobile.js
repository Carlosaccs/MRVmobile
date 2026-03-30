/* ==========================================================================
   js v140.9.8 - UPDATE: LÓGICA DE ESTOQUE REFINADA + PLANTAS (K ATÉ L)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let regiaoAtivaGeral = null; 
window.dadosGerais = [];

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const ALTURA_PADRAO = "28px";

function obterNomeZona(sigla) {
    const s = sigla ? sigla.trim().toUpperCase() : "";
    switch(s) {
        case "ZO": return "Z. OESTE";
        case "ZL": return "Z. LESTE";
        case "ZN": return "Z. NORTE";
        case "ZS": return "Z. SUL";
        case "C":  return "CENTRO";
        default: return ""; 
    }
}

/* --- FULLSCREEN --- */
function atualizarIconeFullscreen() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    btn.innerHTML = isFull ? `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>` : `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>`;
}
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('webkitfullscreenchange', atualizarIconeFullscreen);

function solicitarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

function alternarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

/* --- DADOS --- */
async function carregarPlanilha() {
    try {
        const res = await fetch(`${URL_PLANILHA}&cache_buster=${Date.now()}`);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^3]*$)/);
            if (c.length >= 17) { 
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                const nomeResidencial = limpar(c[4]);
                
                if (nomeResidencial !== "") {
                    window.dadosGerais.push({
                        id: limpar(c[0]).toLowerCase(),
                        categoria: limpar(c[1]).toUpperCase(),
                        ordem: parseInt(limpar(c[2])) || 9999,
                        zona: limpar(c[3]).toUpperCase(),
                        nomeCurto: nomeResidencial,
                        endereco: limpar(c[7]),
                        precosRaw: limpar(c[8]),
                        destaqueCampanha: limpar(c[16]), 
                        link: limpar(c[16]), 
                        descLonga: limpar(c[18]),
                        bookCliente: c[25] ? limpar(c[25]) : "",
                        bookCorretor: c[26] ? limpar(c[26]) : "",
                        videoDecorado: c[27] ? limpar(c[27]) : "",
                        estoque: limpar(c[6]),     
                        entrega: limpar(c[9]),     
                        plantaMin: limpar(c[10]),  // Coluna K
                        plantaMax: limpar(c[11]),  // Coluna L
                        obra: limpar(c[12]),       
                        limitador: limpar(c[13]),  
                        cPaulista: limpar(c[15])   
                    });
                }
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro planilha:", e); }
}

function obterCorPorZona(info) {
    const z = info.zona ? info.zona.trim().toUpperCase() : "";
    switch(z) {
        case "ZO": return "#ff8c00";
        case "ZL": return "#e31c19";
        case "ZN": return "#0054a6";
        case "ZS": return "#d1147e";
        default: return "#00713a";
    }
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
}

/* --- CLIQUE MAPA --- */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
