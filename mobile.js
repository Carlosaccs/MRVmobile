/**
 * Renderiza as informações na Ficha Técnica (lado direito)
 * Diferencia registros de COMPLEXO e RESIDENCIAL
 */
function renderizarInfo(registro) {
    // Referências dos elementos (conforme seu CSS)
    const nomeImovel = document.getElementById('nome-imovel');
    const enderecoTexto = document.querySelector('.endereco-texto');
    const containerAcoes = document.querySelector('.container-acoes');
    const textoColunaR = document.querySelector('.texto-coluna-r');
    const textoDescricao = document.getElementById('texto-descricao');
    
    // Mapeamento das colunas (Ajuste se os índices forem diferentes)
    const categoria = registro[1];  // Coluna B
    const nome = registro[2];       // Coluna C
    const endereco = registro[5];   // Coluna F
    const dadoColunaR = registro[17]; // Coluna R (Ex: Zoneamento ou Metragem)
    const textoGrande = registro[20]; // Coluna U (Descrição)
    const linkMaps = registro[11];   // Exemplo: Coluna L
    const linkPdf = registro[22];    // Exemplo: Coluna W

    // 1. O nome sempre aparece
    nomeImovel.innerText = nome;

    if (categoria === "COMPLEXO") {
        // --- LÓGICA PARA COMPLEXO ---
        // Esconde endereço e dados técnicos (as "caixas brancas")
        if (enderecoTexto) enderecoTexto.style.display = 'none';
        if (textoColunaR) textoColunaR.style.display = 'none';
        
        // Ajusta o texto para branco e tabulado (usando a classe que criamos no CSS)
        textoDescricao.className = "texto-complexo-estilo";
        textoDescricao.innerText = textoGrande;

        // Limpa botões extras e adiciona apenas o que for relevante
        containerAcoes.innerHTML = '';
        if (linkPdf) {
            containerAcoes.innerHTML += `<a href="${linkPdf}" target="_blank" class="btn-acao btn-link">VER APRESENTAÇÃO PDF</a>`;
        }
        
    } else {
        // --- LÓGICA PARA RESIDENCIAL ---
        // Mostra endereço e dados
        if (enderecoTexto) {
            enderecoTexto.style.display = 'block';
            enderecoTexto.innerText = endereco;
        }
        if (textoColunaR) {
            textoColunaR.style.display = 'block';
            textoColunaR.innerText = dadoColunaR;
        }

        // Volta o texto para o estilo padrão (cinza e centralizado/justificado)
        textoDescricao.className = "";
        textoDescricao.innerText = textoGrande;

        // Reconstrói os botões de ação padrão
        containerAcoes.innerHTML = `
            <a href="${linkMaps}" target="_blank" class="btn-acao btn-maps">GOOGLE MAPS</a>
            ${linkPdf ? `<a href="${linkPdf}" target="_blank" class="btn-acao btn-link">FOLDER DIGITAL</a>` : ''}
        `;
    }
}
