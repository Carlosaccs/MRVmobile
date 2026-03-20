/* ==========================================================================
   CONFIGURAÇÕES E SELETORES (Sincronizados com v26)
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const listaBotoes = document.getElementById('lista-botoes');
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "http://www.w3.org/2000/svg";

// URL da planilha publicada como CSV
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
    // 1. Carrega o mapa inicial (Grande SP)
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        containerMapa.innerHTML = "Erro: Arquivo mapa-SP.js não encontrado.";
    }
    
    // 2. Carrega os botões da planilha
    carregarDadosPlanilha();
};

/* ==========================================================================
   MOTOR DA PLANILHA (Sincronizado com Coluna D)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        
        // Divide as linhas, mas lida melhor com possíveis vírgulas no texto
        const linhas = csvText.split('\n').slice(1); 

        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            // Regex simples para separar por vírgula, ignorando vírgulas dentro de aspas
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (col.length < 5) return;

            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),
                nomeExibicao: col[3].replace(/"/g, '').trim(), // APENAS COLUNA D
                estoque: col[5]?.replace(/"/g, '').trim() || "0"
            };

            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            
            // Layout sem linhas horizontais e focado na Coluna D
            btn.innerHTML = `
                <div style="color: #00713a; font-size: 1rem; font-weight: 800; line-height: 1.2;">
                    ${registro.nomeExibicao}
                </div>
                <div style="margin-top: 5px; color: #888; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">
                    Restam ${registro.estoque} unidades
                </div>
            `;

            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro na leitura:", e); }
}
function selecionarEmpreendimento(reg, elemento) {
    // Destaque no botão
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    elemento.classList.add('ativo');

    // Atualiza a ficha
    fichaNome.innerText = reg.nomeCurto;
    fichaDetalhes.innerHTML = `<p>${reg.desc}</p><p><strong>Regional:</strong> ${reg.reg}</p>`;

    // Pinta o mapa
    document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
    const shape = document.getElementById(reg.idPath);
    if (shape) { 
        shape.style.fill = "#ff8c00"; // Laranja ao clicar
    }
}

/* ==========================================================================
   MOTOR DO MAPA (SVG)
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
        path.style.fill = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.style.cursor = "pointer";
        
        path.onclick = () => {
            fichaNome.innerText = pData.name;
            document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
            path.style.fill = "#ff8c00";
        };
        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

// Abre/Fecha Menu
document.querySelector('.icon-bottom').onclick = () => {
    document.getElementById('menu-empreendimentos').classList.toggle('aberto');
};
