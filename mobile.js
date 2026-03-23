/* ==========================================================================
   v168 - JS ESTÁVEL COM TROCA DE MAPAS E MENU LARGO
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; 
window.listaCompleta = []; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// 1. CARREGAMENTO
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim() !== "");
        
        window.bancoDados = {}; 
        window.listaCompleta = [];

        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 4) {
                const idPath = c[0].replace(/["']/g, '').trim().toLowerCase();
                const item = {
                    idPath: idPath,
                    ordem: parseInt(c[2]) || 99999,
                    nomeCurto: c[3]?.replace(/["']/g, '').trim() || "",
                    obs: c[18]?.replace(/["']/g, '').trim() || "",
                    estoque: c[5]?.replace(/["']/g, '').trim() || "0",
                    statusObra: c[11]?.replace(/["']/g, '').trim() || "Consulte"
                };
                if (idPath && item.nomeCurto) {
                    if (!window.bancoDados[idPath]) window.bancoDados[idPath] = [];
                    window.bancoDados[idPath].push(item);
                    window.listaCompleta.push(item);
                }
            }
        });

        atualizarContador();
        if (typeof MAPA_GSP !== 'undefined') atualizarVisualizacao();
    } catch (e) { console.error("Erro CSV:", e); }
}

function atualizarContador() {
    const total = window.listaCompleta.length;
    const contador = document.getElementById('contador-registros');
    if (contador) {
        contador.innerText = total.toString().padStart(2, '0');
        contador.style.color = (total >= 42) ? "#ADFF2F" : "#FFFF00";
    }
}

// 2. INTERFACE E MENU
function toggleMenuLateral() {
    const menu = document.getElementById('menu-lateral-container');
    if (menu) {
        menu.classList.toggle('aberto');
        if (menu.classList.contains('aberto')) popularMenuResidenciais();
    }
}

function popularMenuResidenciais() {
    const trilho = document.getElementById('trilho-infinito');
    if (!trilho) return;
    trilho.innerHTML = "";

    const ordenados = [...window.listaCompleta].sort((a, b) => {
        if (a.ordem !== b.ordem) return a.ordem - b.ordem;
        return a.nomeCurto.localeCompare(b.nomeCurto);
    });

    ordenados.forEach(item => {
        const card = document.createElement('div');
        const nomeUpper = item.nomeCurto.toUpperCase();
        let classeZona = "";
        if (nomeUpper.startsWith("ZO")) classeZona = "zona-zo";
        else if (nomeUpper.startsWith("ZL")) classeZona = "zona-zl";
        else if (nomeUpper.startsWith("ZN")) classeZona = "zona-zn";
        else if (nomeUpper.startsWith("ZS")) classeZona = "zona-zs";

        card.className = `card-residencial ${classeZona}`;
        card.innerHTML = `<span>${nomeUpper}</span>`;
        card.onclick = (e) => {
            e.stopPropagation();
            exibirDadosNoPainel(item.idPath, item.nomeCurto);
        };
        trilho.appendChild(card);
    });
}

function exibirDadosNoPainel(idPath, filtrarNome = null) {
    const lista = window.bancoDados[idPath];
    if (!lista) return;
    const itens = filtrarNome ? lista.filter(i => i.nomeCurto === filtrarNome) : lista;
    document.getElementById('nome-imovel').innerText = idPath.toUpperCase();
    document.getElementById('detalhes-imovel').innerHTML = itens.map(info => `
        <div style="margin-bottom: 25px;">
            <p style="color: #FFD700; font-size: 11px; margin-bottom: 5px;">${info.obs}</p>
            <h3 style="color: #ADFF2F; margin: 0;">${info.nomeCurto}</h3>
            <p>Estoque: ${info.estoque} | Status: ${info.statusObra}</p>
        </div>
    `).join("");
}

// 3. MAPA E TROCA (RESTAURADO)
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;
    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);

    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight;
        svg.style.marginLeft = conf.marginLeft;
        svg.style.transform = `scale(${conf.scale})`;
    }

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const ehMRV = pData.class === "commrv";
        path.setAttribute("d", pData.d);
        path.style.fill = ehMRV ? "#00713a" : "#cccccc";
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";

        if (!ehMinimizado && ehMRV) {
            path.onclick = () => {
                document.getElementById('identificador-cidade').innerText = pData.name || pData.id;
                exibirDadosNoPainel(pData.id.toLowerCase());
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function atualizarVisualizacao() {
    desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
    desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    atualizarVisualizacao();
}

window.onload = () => carregarPlanilha();
