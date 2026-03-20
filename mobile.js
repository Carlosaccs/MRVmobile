/* ==========================================================================
   CONFIGURAÇÕES E SELETORES (Sincronizados com o HTML v25)
   ========================================================================== */
// Ajustado: Seu HTML usa a classe 'area-mapa' como container
const containerMapa = document.querySelector('.area-mapa'); 
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "http://www.w3.org/2000/svg";

// URL da sua planilha (Já no formato CSV para o JS ler)
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E/pub?output=csv'; 

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP); // Tenta carregar o mapa do seu mapa-SP.js
    } else {
        console.error("Erro: O arquivo mapa-SP.js não foi carregado.");
    }
    carregarDadosPlanilha(); // Tenta carregar os botões da planilha
};

/* ==========================================================================
   MOTOR DA PLANILHA (Gerador de Botões)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1); 

        const listaBotoes = document.getElementById('lista-botoes');
        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            const col = linha.split(',');
            if (col.length < 5) return;

            const registro = {
                idPath: col[0].trim(),
                categoria: col[1].trim(),
                nomeCurto: col[3].trim(),
                estoque: col[5].trim(),
                reg: col[13].trim(),
                desc: col[17].trim()
            };

            const btn = document.createElement('div');
            // Aplica o design do print: escuro para COMPLEXO, branco para o resto
            btn.className = `btn-empreendimento ${registro.categoria === 'COMPLEXO' ? 'complexo' : ''}`;
            btn.setAttribute('data-zona', registro.reg);
            
            btn.innerHTML = `
                <span>${registro.reg} ${registro.nomeCurto}</span>
                <span class="estoque-label">${registro.estoque ? 'RESTAM ' + registro.estoque + ' UN.' : '-'}</span>
            `;

            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro no CSV:", e); }
}

function selecionarEmpreendimento(reg, elemento) {
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    elemento.classList.add('ativo');

    fichaNome.innerText = reg.nomeCurto;
    fichaDetalhes.innerHTML = `<p>${reg.desc}</p><p><strong>Status:</strong> ${reg.estoque} unidades.</p>`;

    // Pinta a região no mapa
    document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
    const shape = document.getElementById(reg.idPath);
    if (shape) { shape.style.fill = "#ff8c00"; }
}

/* ==========================================================================
   MOTOR DO MAPA (Engine SVG)
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

// Controle do Menu
document.querySelector('.icon-bottom').onclick = () => {
    document.getElementById('menu-empreendimentos').classList.toggle('aberto');
};
