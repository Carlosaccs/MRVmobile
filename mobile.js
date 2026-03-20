/* ==========================================================================
   BLOCO 01: CONFIGURAÇÕES E SELETORES
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const listaBotoes = document.getElementById('lista-botoes');
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "http://www.w3.org/2000/svg";

// URL da planilha publicada como CSV
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* ==========================================================================
   BLOCO 05: INICIALIZAÇÃO DO SISTEMA
   ========================================================================== */
window.onload = () => {
    // 1. Carrega o mapa inicial (Grande SP) definido no mapa-SP.js
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        if(containerMapa) containerMapa.innerHTML = "Erro: Arquivo mapa-SP.js não encontrado.";
    }
    
    // 2. Carrega os botões da planilha
    carregarDadosPlanilha();
};

/* ==========================================================================
   BLOCO 10: MOTOR DA PLANILHA (Leitura e Geração de Botões)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1); // Pula o cabeçalho

        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            // Regex para separar por vírgula respeitando aspas
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (col.length < 5) return;

            // Tratamento dos dados conforme sua planilha
            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),      // Coluna A
                zona: col[1]?.replace(/"/g, '').trim() || "", // Coluna B (Para o CSS de borda)
                nomeExibicao: col[3].replace(/"/g, '').trim(),// Coluna D (Título do Card)
                estoque: col[5]?.replace(/"/g, '').trim() || "0" // Coluna F
            };

            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            
            // Atribui a zona para o CSS pintar a borda colorida (Bloco 70.3 do CSS)
            btn.setAttribute('data-zona', registro.zona);
            
            // HTML Interno do botão (Título Coluna D + Estoque Coluna F)
            btn.innerHTML = `
                <div style="color: #333; font-size: 0.9rem; font-weight: 800; line-height: 1.1;">
                    ${registro.nomeExibicao}
                </div>
                <div style="margin-top: 5px; color: #888; font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">
                    Restam ${registro.estoque} unidades
                </div>
            `;

            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro na leitura da planilha:", e); }
}

/* ==========================================================================
   BLOCO 20: INTERAÇÃO (Clique no Botão)
   ========================================================================== */
function selecionarEmpreendimento(reg, elemento) {
    // 1. Destaque Visual no Botão
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    elemento.classList.add('ativo');

    // 2. Atualiza a Ficha Técnica
    if(fichaNome) fichaNome.innerText = reg.nomeExibicao;
    if(fichaDetalhes) {
        fichaDetalhes.innerHTML = `<p><strong>Unidades disponíveis:</strong> ${reg.estoque}</p>`;
    }

    // 3. Pinta o mapa (Laranja no selecionado, Verde nos outros)
    document.querySelectorAll('path').forEach(p => {
        // Se o path tiver a classe 'semmrv' (do mapa-SP.js), mantém cinza
        const originalColor = p.getAttribute('data-original-fill') || "#00713a";
        p.style.fill = originalColor;
    });

    const shape = document.getElementById(reg.idPath);
    if (shape) { 
        shape.style.fill = "#ff8c00"; // Laranja MRV
    }
}

/* ==========================================================================
   BLOCO 30: MOTOR DO MAPA (SVG)
   ========================================================================== */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) return;
    
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        
        // Define a cor base
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.setAttribute('data-original-fill', corBase);
        
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.style.cursor = "pointer";
        
        path.onclick = () => {
            if(fichaNome) fichaNome.innerText = pData.name;
            document.querySelectorAll('path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            path.style.fill = "#ff8c00"; // Laranja ao clicar direto no mapa
        };
        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

/* ==========================================================================
   BLOCO 40: INTERFACE (Menu Lateral)
   ========================================================================== */
// Abre/Fecha Menu através do ícone de hambúrguer (icon-bottom)
const btnMenu = document.querySelector('.icon-bottom');
if(btnMenu) {
    btnMenu.onclick = () => {
        const menu = document.getElementById('menu-empreendimentos');
        if(menu) menu.classList.toggle('aberto');
    };
}
