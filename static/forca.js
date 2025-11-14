document.addEventListener('DOMContentLoaded', () => {
    // A lógica de seleção de menu, botões, etc., é muito parecida com a do Jogo da Velha
    // e o fluxo de comunicação com o back-end também.

    const startMenu = document.getElementById('start-menu');
    const gameContainer = document.getElementById('game-container');
    const themeSelect = document.getElementById('theme-select');
    const difficultySelect = document.getElementById('difficulty-select');
    const startButton = document.getElementById('start-button');
    const hangmanDrawing = document.getElementById('hangman-drawing');
    const hintText = document.getElementById('hint-text');
    const wordDisplay = document.getElementById('word-display');
    const lettersGuessedSpan = document.querySelector('#letters-guessed span');
    const letterInput = document.getElementById('letter-input');
    const guessButton = document.getElementById('guess-button');
    const chancesText = document.getElementById('chances-text');
    const winStreakCounter = document.getElementById('win-streak-counter');
    const endGameModal = document.getElementById('end-game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalWord = document.getElementById('modal-word');
    const playAgainButton = document.getElementById('play-again-button');

    let FORCA_VISUAL_JS = [];
    let maxErros = 0;
    let winStreak = localStorage.getItem('forcaWinStreak') ? parseInt(localStorage.getItem('forcaWinStreak')) : 0;
    winStreakCounter.textContent = winStreak;

    function atualizarInterface(dadosDoJogo) {
        hintText.textContent = dadosDoJogo.dica;
        lettersGuessedSpan.textContent = dadosDoJogo.letrasTentadas.join(', ');
        chancesText.textContent = dadosDoJogo.max_erros - dadosDoJogo.erros;

        if (dadosDoJogo.erros < FORCA_VISUAL_JS.length) {
            hangmanDrawing.textContent = FORCA_VISUAL_JS[dadosDoJogo.erros];
        }

        // --- LÓGICA PARA CRIAR AS "CAIXINHAS" ---
        wordDisplay.innerHTML = '';
        dadosDoJogo.palavra.forEach(letra => {
            const letraSpan = document.createElement('span');
            letraSpan.textContent = letra;
            if (letra === ' ' || letra === '-') {
                letraSpan.classList.add('word-space');
            } else {
                letraSpan.classList.add('word-letter');
            }
            wordDisplay.appendChild(letraSpan);
        });
        // --- FIM DA LÓGICA ---

        if (dadosDoJogo.status && dadosDoJogo.status !== 'em_andamento') {
            finalizarJogo(dadosDoJogo);
        }
    }

    function finalizarJogo(dados) {
        letterInput.disabled = true;
        guessButton.disabled = true;

        if (dados.status === 'vitoria') {
            winStreak++;
            modalTitle.textContent = "Parabéns, Você Venceu!";
        } else {
            winStreak = 0;
            modalTitle.textContent = "Que Pena, Você Perdeu!";
        }
        
        localStorage.setItem('forcaWinStreak', winStreak);
        winStreakCounter.textContent = winStreak;
        modalWord.textContent = dados.palavra_final;

       setTimeout(() => {
        // Certifique-se que o ID correto está sendo usado para o modal
        const modalElement = document.getElementById('end-game-modal'); 
        if (modalElement) {
             modalElement.style.display = 'flex'; // Torna o modal visível
        } else {
            console.error("Erro: O elemento do modal de fim de jogo não foi encontrado no HTML!");
        }
    }, 500); // Pequeno delay
}

    startButton.addEventListener('click', async () => {
        const theme = themeSelect.value;
        const difficulty = difficultySelect.value;
        
        const response = await fetch('/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme, difficulty })
        });
        
        if (response.ok) {
            const gameData = await response.json();
            FORCA_VISUAL_JS = gameData.forca_visual;
            maxErros = gameData.max_erros;
            startMenu.style.display = 'none';
            gameContainer.style.display = 'block';
            atualizarInterface(gameData);
            letterInput.focus();
        } else {
            alert("Erro ao iniciar o jogo. Verifique se o arquivo do tema existe.");
        }
    });

    playAgainButton.addEventListener('click', () => {
        window.location.reload();
    });

    guessButton.addEventListener('click', async () => {
        const letra = letterInput.value.toLowerCase();
        
        if (!/^[a-z]$/.test(letra)) {
            alert('Por favor, digite apenas UMA LETRA (de A a Z).');
            letterInput.value = '';
            letterInput.focus();
            return;
        }

        const response = await fetch('/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letter: letra })
        });
        
        const gameData = await response.json();
        if (gameData.max_erros) maxErros = gameData.max_erros; 
        atualizarInterface(gameData);

        letterInput.value = '';
        letterInput.focus();
    });

    letterInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            guessButton.click();
        }
    });
});
