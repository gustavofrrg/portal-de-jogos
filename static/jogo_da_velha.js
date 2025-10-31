document.addEventListener('DOMContentLoaded', () => {
    // --- Seleção dos Elementos ---
    const modeSelection = document.getElementById('mode-selection');
    const pvpButton = document.getElementById('p-vs-p-button');
    const pvcButton = document.getElementById('p-vs-cpu-button');
    const gameArea = document.getElementById('game-area');
    const boardElement = document.getElementById('board');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');
    const winningLine = document.getElementById('winning-line');

    let gameMode = null;
    let jogoFinalizado = false;

    // --- Funções ---
    function atualizarInterface(gameState) {
        // Atualiza as células do tabuleiro com 'X' e 'O'
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = document.querySelector(`.cell[data-linha='${i}'][data-coluna='${j}']`);
                const peca = gameState.tabuleiro[i][j];
                cell.textContent = peca;
                cell.classList.remove('x', 'o');
                if (peca === 'X') cell.classList.add('x');
                else if (peca === 'O') cell.classList.add('o');
            }
        }

        winningLine.className = 'winning-line'; // Limpa a classe da linha da vitória anterior

        // Verifica o status do jogo para atualizar o texto e a linha da vitória
        if (gameState.status !== 'em_andamento') {
            jogoFinalizado = true;
            if (gameState.status === 'empate') {
                statusDisplay.textContent = "Fim de Jogo: Deu velha (empate)!";
            } else {
                statusDisplay.textContent = `Fim de Jogo: Jogador '${gameState.vencedor}' venceu!`;
                if (gameState.linha_vitoria) {
                    winningLine.classList.add(gameState.linha_vitoria);
                    winningLine.classList.add('show');
                }
            }
        } else {
            statusDisplay.textContent = `É a vez do jogador '${gameState.jogador_atual}'`;
        }
    }

    async function iniciarJogo() {
        jogoFinalizado = false;
        if (!gameMode) return;
        
        const response = await fetch('/jdv/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: gameMode })
        });
        const gameState = await response.json();
        atualizarInterface(gameState);
    }
    
    async function onCellClick(event) {
        if (jogoFinalizado || event.target.textContent.trim() !== '') {
            return;
        }

        const cell = event.target;
        const linha = cell.dataset.linha;
        const coluna = cell.dataset.coluna;
        
        const response = await fetch('/jdv/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linha: parseInt(linha), coluna: parseInt(coluna) })
        });
        const gameState = await response.json();
        atualizarInterface(gameState);
    }
    
    // --- Inicialização e Eventos ---
    modeSelection.style.display = 'block';
    gameArea.style.display = 'none';

    pvpButton.addEventListener('click', () => {
        gameMode = 'pvp';
        modeSelection.style.display = 'none';
        gameArea.style.display = 'block';
        iniciarJogo();
    });

    pvcButton.addEventListener('click', () => {
        gameMode = 'pvc';
        modeSelection.style.display = 'none';
        gameArea.style.display = 'block';
        iniciarJogo();
    });
    
    // Cria as células do tabuleiro dinamicamente
    boardElement.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.linha = i;
            cell.dataset.coluna = j;
            cell.addEventListener('click', onCellClick);
            boardElement.appendChild(cell);
        }
    }
    
    restartButton.addEventListener('click', iniciarJogo);
});