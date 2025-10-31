// Arquivo: static/damas.js (VERSÃO FINAL SEM TIMER NO PVC)

document.addEventListener('DOMContentLoaded', () => {
    // --- Seleção de Elementos ---
    const modeSelection = document.getElementById('mode-selection');
    const pvpButton = document.getElementById('p-vs-p-button');
    const pvcButton = document.getElementById('p-vs-cpu-button');
    const gameArea = document.getElementById('game-area');
    const boardElement = document.getElementById('board');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');
    const placarPretas = document.getElementById('placar-pretas');
    const placarBrancas = document.getElementById('placar-brancas');
    const timerPretas = document.getElementById('timer-p');
    const timerBrancas = document.getElementById('timer-b');
    const gameContainer = document.querySelector('.game-container'); // Seleciona o container principal

    // --- Estado do Front-end ---
    let pecaSelecionada = null;
    let movimentosValidos = [];
    let gameState = {};
    const TEMPO_INICIAL = 300;
    let tempoPretas = TEMPO_INICIAL;
    let tempoBrancas = TEMPO_INICIAL;
    let timerID = null;
    let gameMode = null; // Mova gameMode para cá para ser acessível globalmente no script

    // --- Funções de Tempo (com verificação de modo) ---
    function formatarTempo(segundos) {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    }

    function pararTimer() {
        if (timerID) {
            clearInterval(timerID);
            timerID = null;
        }
        timerPretas.classList.remove('active');
        timerBrancas.classList.remove('active');
    }

    function trocarTimer() {
        // SÓ EXECUTA SE FOR PvP
        if (gameMode !== 'pvp') {
            pararTimer(); // Garante que qualquer timer anterior seja parado
            return;
        }
        
        pararTimer();
        if (gameState.status.startsWith('vitoria')) return;

        const jogadorDaVez = gameState.jogador_atual;
        const timerAtivo = jogadorDaVez === 'b' ? timerBrancas : timerPretas;
        let tempoRestante = jogadorDaVez === 'b' ? tempoBrancas : tempoPretas;

        timerAtivo.classList.add('active');
        timerID = setInterval(() => {
            tempoRestante--;
            if (jogadorDaVez === 'b') tempoBrancas = tempoRestante;
            else tempoPretas = tempoRestante;
            
            timerAtivo.textContent = formatarTempo(tempoRestante);

            if (tempoRestante <= 0) {
                pararTimer();
                const vencedor = jogadorDaVez === 'b' ? 'P' : 'B';
                statusDisplay.textContent = `Fim de Jogo: Tempo esgotado! Jogador '${vencedor}' venceu!`;
                gameState.status = `vitoria_${vencedor.toLowerCase()}`;
                // Poderíamos adicionar uma chamada à API aqui para registrar a vitória por tempo, se quiséssemos
            }
        }, 1000);
    }
    
    // --- Funções do Jogo ---
    function limparDestaques() { /* ... (igual) ... */ }
    function atualizarInterface(newGameState) { /* ... (igual, mas chama trocarTimer condicionalmente) ... */ }
    async function selecionarPeca(cell, linha, coluna) { /* ... (igual) ... */ }
    async function onCellClick(event) { /* ... (igual) ... */ }
    async function iniciarJogo() { /* ... (igual, mas reseta e inicia o timer condicionalmente) ... */ }

    // --- CÓDIGO COMPLETO (Copie e cole a partir daqui) ---
    function limparDestaques() { document.querySelectorAll('.selected, .valid-move').forEach(el => el.classList.remove('selected', 'valid-move')); }
    
    function atualizarInterface(newGameState) {
        gameState = newGameState;
        document.querySelectorAll('.piece').forEach(p => p.remove());
        limparDestaques();
        placarPretas.textContent = gameState.pecas_p;
        placarBrancas.textContent = gameState.pecas_b;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const peca = gameState.tabuleiro[i][j];
                if (peca !== ' ' && peca !== '#') {
                    const cell = document.querySelector(`.cell[data-linha='${i}'][data-coluna='${j}']`);
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece', peca.toLowerCase());
                    if (peca === 'B' || peca === 'P') pieceElement.classList.add('king');
                    if(cell) cell.appendChild(pieceElement);
                }
            }
        }
        
        if (gameState.status.startsWith('vitoria')) {
            statusDisplay.textContent = `Fim de Jogo: Jogador '${gameState.status.slice(-1).toUpperCase()}' venceu!`;
            pararTimer(); // Para o timer em caso de vitória
        } else if (gameState.status === "captura_em_sequencia") {
            statusDisplay.textContent = `Captura em Sequência! Jogue novamente.`;
            // Não troca o timer aqui, pois o turno continua
        } else {
            statusDisplay.textContent = `É a vez do jogador: '${gameState.jogador_atual.toUpperCase()}'`;
            trocarTimer(); // Troca o timer apenas se for PvP
        }
    }
    
    async function iniciarJogo() {
        if (!gameMode) return;
        pecaSelecionada = null;
        movimentosValidos = [];
        
        // Reseta tempos e display
        tempoBrancas = TEMPO_INICIAL;
        tempoPretas = TEMPO_INICIAL;
        timerBrancas.textContent = formatarTempo(tempoBrancas);
        timerPretas.textContent = formatarTempo(tempoPretas);
        pararTimer(); // Garante que nenhum timer antigo esteja rodando

        const response = await fetch('/damas/start', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: gameMode }) // Envia o modo para o back-end
        });
        const newGameState = await response.json();
        atualizarInterface(newGameState); // A própria atualizarInterface vai iniciar o timer se for PvP
    }
    
    async function onCellClick(event) {
        if (gameState.status.startsWith('vitoria') || (gameMode === 'pvc' && gameState.jogador_atual === 'p')) return;
        const cell = event.currentTarget;
        const linha = parseInt(cell.dataset.linha);
        const coluna = parseInt(cell.dataset.coluna);
        const pecaNoClique = gameState.tabuleiro[linha][coluna];

        if (pecaSelecionada) {
            const ehMovimentoValido = movimentosValidos.some(m => m[0] === linha && m[1] === coluna);
            if (ehMovimentoValido) {
                boardElement.classList.add('ia-thinking'); // Desabilita temporariamente
                const response = await fetch('/damas/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ origem: pecaSelecionada, destino: { linha, coluna } })
                });
                const newGameState = await response.json();
                pecaSelecionada = null;
                movimentosValidos = [];
                atualizarInterface(newGameState);

                if (newGameState.modo === 'pvc' && newGameState.jogador_atual === 'p' && newGameState.status === 'em_andamento') {
                    statusDisplay.textContent = "Computador está pensando...";
                    setTimeout(async () => {
                        const iaResponse = await fetch('/damas/ia_move', { method: 'POST' });
                        const iaGameState = await iaResponse.json();
                        boardElement.classList.remove('ia-thinking');
                        atualizarInterface(iaGameState);
                    }, 1200);
                } else {
                    boardElement.classList.remove('ia-thinking'); // Reabilita se não for a vez da IA
                }
            } else {
                limparDestaques();
                pecaSelecionada = null;
                if (pecaNoClique.toLowerCase() === gameState.jogador_atual) {
                    selecionarPeca(cell, linha, coluna);
                }
            }
        } else {
            if (pecaNoClique.toLowerCase() === gameState.jogador_atual) {
                selecionarPeca(cell, linha, coluna);
            }
        }
    }
    
    async function selecionarPeca(cell, linha, coluna) {
        const response = await fetch('/damas/valid_moves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linha, coluna })
        });
        const data = await response.json();
        if (data.movimentos && data.movimentos.length > 0) {
            pecaSelecionada = { linha, coluna };
            movimentosValidos = data.movimentos;
            limparDestaques();
            if (cell.querySelector('.piece')) cell.querySelector('.piece').classList.add('selected');
            movimentosValidos.forEach(([l, c]) => {
                document.querySelector(`.cell[data-linha='${l}'][data-coluna='${c}']`).classList.add('valid-move');
            });
        }
    }

    // --- Inicialização ---
    boardElement.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', (i + j) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.linha = i; cell.dataset.coluna = j;
            if ((i + j) % 2 !== 0) cell.addEventListener('click', onCellClick);
            boardElement.appendChild(cell);
        }
    }
    restartButton.addEventListener('click', iniciarJogo);
    
    // ATUALIZAÇÃO: Adiciona/Remove classe pvc-mode
    pvpButton.addEventListener('click', () => {
        gameMode = 'pvp';
        gameContainer.classList.remove('pvc-mode'); // Remove a classe
        modeSelection.style.display = 'none';
        gameArea.style.display = 'block';
        iniciarJogo();
    });
    pvcButton.addEventListener('click', () => {
        gameMode = 'pvc';
        gameContainer.classList.add('pvc-mode'); // Adiciona a classe
        modeSelection.style.display = 'none';
        gameArea.style.display = 'block';
        iniciarJogo();
    });
});