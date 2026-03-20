/* ==========================================================================
   CONFIGURAÇÕES E SELETORES
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv";

// COLOQUE AQUI O LINK DA SUA PLANILHA PUBLICADA COMO CSV
const URL_PLANILHA_CSV = 'SUA_URL_DA_PLANILHA_AQUI'; 

/* ==========================================================================
   INICIALIZAÇÃO E CARREGAMENTO DE DADOS
   ========================================================================== */
window.onload = () => {
    renderizarMapa(MAPA_GSP); // Inicia o mapa
    carregarDadosPlanilha();  // Inicia a lista de botões
};

async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1); // Pula o cabeçalho

        const listaBotoes = document.getElementById('lista-botoes');
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            const col = linha.split(',');
            if (col.length < 5) return;

            // Mapeamento das colunas conforme sua lista
            const registro = {
                idPath: col[0].trim(),
                categoria: col[1].trim(),
                nomeCurto: col[3].trim(),
                estoque: col[5].trim(),
                reg: col[13].trim(),
                desc: col[17].trim()
            };

            // Criar o botão seguindo o design do print laranja/escuro
            const btn = document.createElement('div');
            btn.className = `btn-empreendimento ${registro.categoria === 'COMPLEXO' ? 'complexo' : ''}`;
            btn.setAttribute('data-zona', registro.reg);
            
            btn.innerHTML = `
                <span>${registro.reg} ${registro.nomeCurto}</span>
                <span class="estoque-label">${registro.estoque ? 'RESTAM ' + registro.estoque + ' UN.' : '-'}</span>
            `;

            btn.onclick = () => clicarNoBotao(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro ao carregar CSV:", e); }
}

/* ==========================================================================
   INTERAÇÃO: BOTÃO -> MAPA -> FICHA
   ========================================================================== */
function clicarNoBotao(registro, elementoBtn) {
    // 1. Destaque visual no botão (Laranja)
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    elementoBtn.classList.add('ativo');

    // 2. Atualizar a Ficha Técnica
    fichaNome.innerText = registro.nomeCurto;
    fichaDetalhes.innerHTML = `
        <p style="margin-top:10px;">${registro.desc}</p>
        <p><strong>Regional:</strong> ${registro.reg}</p>
    `;

    // 3. Comandar o Mapa (Encontrar o path pelo ID)
    document.querySelectorAll('path').forEach(p => {
        p.style.fill = "#00713a"; // Reseta todos para verde MRV
        p.style.strokeWidth = "2";
    });

    const regiaoNoMapa = document.getElementById(registro.idPath);
    if (regiaoNoMapa) {
        regiaoNoMapa.style.fill = "#ff8c00"; // Pinta a região de Laranja
        regiaoNoMapa.style.strokeWidth = "5";
        // Opcional: Centralizar ou dar zoom (podemos fazer depois)
    }
}

/* ==========================================================================
   MOTOR DO MAPA (MANTER O QUE VOCÊ JÁ TINHA)
   ========================================================================== */
function renderizarMapa(dadosEstado) {
    if (!dadosEstado) return;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dadosEstado.viewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");

    const grupoPrincipal = document.createElementNS(svgNS, "g");
    grupoPrincipal.setAttribute("transform", dadosEstado.transform);

    dadosEstado.paths.forEach(pathData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathData.d);
        path.setAttribute("id", pathData.id);
        path.setAttribute("class", pathData.class || "regiao-padrao");
        path.style.fill = pathData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.style.cursor = "pointer";

        path.onclick = () => {
            // Se clicar no mapa, ele tenta achar o botão correspondente
            atualizarFicha(pathData);
            document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
            path.style.fill = "#ff8c00";
        };

        grupoPrincipal.appendChild(path);
    });

    svg.appendChild(grupoPrincipal);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

function atualizarFicha(item) {
    fichaNome.innerText = item.name;
    fichaDetalhes.innerHTML = `<p>Toque em um empreendimento no menu para ver detalhes.</p>`;
}

// Controle do Menu
document.querySelector('.icon-bottom').onclick = () => {
    document.getElementById('menu-empreendimentos').classList.toggle('aberto');
};
