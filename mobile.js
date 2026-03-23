/* ==========================================================================
   v153 - VERSÃO ESTABILIZADA (FIX: RENDERIZAÇÃO E CATEGORIA)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; 
window.listaCompleta = []; 

// 1. CARREGAMENTO DOS DADOS
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
                const categoria = c[1]?.replace(/["']/g, '').trim().toUpperCase() || "RESIDENCIAL";
                const ordem = parseInt(c[2]) || 99999;
                const nomeCurto = c[3]?.replace(/["']/g, '').trim() || "";

                if (idPath && nomeCurto) {
                    const item = {
                        idPath: idPath,
                        categoria: categoria,
                        ordem: ordem,
                        nomeCurto: nomeCurto,
                        estoque: c[5]?.replace(/["']/g, '').trim() || "-",
                        statusObra: c[11]?.replace(/["']/g, '').trim() || "Consulte"
                    };

                    if (!window.bancoDados[idPath]) window.bancoDados[idPath] = [];
                    window.bancoDados[idPath].push(item);
                    window.listaCompleta.push(item);
                }
            }
        });

        // Atualiza contador com segurança
        const contador = document.getElementById('contador-registros');
        if (contador) {
            const total = window.listaCompleta.length;
            contador.innerText = total.toString().padStart(2, '0');
            contador.style.color = (total >= 42) ? "#ADFF2F" : "#FFFF00";
        }

        if (typeof MAPA_GSP !== 'undefined') atualizarVisualizacao();
    } catch (e) { 
        console.error("Erro ao carregar planilha:", e); 
    }
}

// 2. FUNÇÕES DE MENU
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
        const nomeUpper = item.nomeCurto.toUpperCase().trim();
        
        // Cores das Zonas baseadas no prefixo
        let classeZona = "zona-verde";
        if (nomeUpper.startsWith("ZO")) classeZona = "zona-zo";
        else if (nomeUpper.startsWith("ZL")) classeZona = "zona-zl";
        else if (nomeUpper.startsWith("ZN")) classeZona = "zona-zn";
        else if (nomeUpper.startsWith("ZS")) classeZona = "zona-zs";

        const classeComplexo = (item.categoria === "COMPLEXO") ? "card-complexo" : "";
        card.className = `card-residencial ${classeZona} ${classeComplexo}`;
        
        const estoqueTexto = (item.estoque === "-" || item.estoque === "0") ? "" : item.estoque;

        card.innerHTML = `
            <span>${nomeUpper}</span>
            <span class="estoque-status">${estoqueTexto}</span>
        `;
        
        card.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.card-residencial').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');

            const pathOriginal = document.getElementById(item.idPath);
            if (pathOriginal) {
                exibirDadosNoPainel(item.idPath, item.nomeCurto);
                pathOriginal.style.fill = "#FF4500";
                // toggleMenuLateral(); // Opcional: fechar ao clicar
            }
        };
        trilho.appendChild(card);
    });
}

// 3. RENDERIZAÇÃO DO MAPA E PAINEL
function exibirDadosNoPainel(idPath, filtrarNome = null) {
    const listaImoveis = window.bancoDados[idPath];
    const tituloPainel = document.getElementById('nome-imovel');
    const detalhesPainel = document.getElementById('detalhes-imovel');

    if (!listaImoveis) return;

    const itens = filtrarNome 
        ? listaImoveis.filter(i => i.nomeCurto === filtrarNome)
        : listaImoveis;

    tituloPainel.innerText = idPath.toUpperCase();
    detalhesPainel.innerHTML = itens.map(info => `
        <div style="margin-bottom: 25px; border-bottom: 2px solid #444; padding-bottom: 15px;">
            <h3 style="color: #ADFF2F; margin: 0 0 10px 0; font-size: 1.2rem;">${info.nomeCurto}</h3>
            <p style="margin: 5px 0;"><strong>Estoque:</strong> ${info.estoque}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${info.statusObra}</p>
        </div>
    `).join("");
}

// Mantém as demais funções (desenharMapa, atualizarVisualizacao, trocarMapas, etc.)
// ... (Copie o restante do seu arquivo v148 original aqui para baixo)

window.onload = () => carregarPlanilha();
