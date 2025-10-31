// Arquivo: static/termo.js (VERSÃO FINAL COM LÓGICA DE FOCO)

document.addEventListener('DOMContentLoaded', () => {
    // --- Seleção de Elementos ---
    const grid = document.getElementById('termo-grid');
    const keyboardContainer = document.getElementById('keyboard');
    const messageArea = document.getElementById('message-area');
    const winStreakCounter = document.getElementById('win-streak-counter');
    const endGameModal = document.getElementById('end-game-modal');
    // ... (resto da seleção do modal)
    const modalTitle = document.getElementById('modal-title');
    const modalWord = document.getElementById('modal-word');
    const modalStreak = document.getElementById('modal-streak');
    const playAgainButton = document.getElementById('play-again-button');

    // --- Constantes e Novo Estado ---
    const TAMANHO_PALAVRA = 5;
    const MAX_TENTATIVAS = 6;
    
    let currentRow = 0;
    let gameStatus = 'em_andamento';
    let winStreak = localStorage.getItem('termoWinStreak') ? parseInt(localStorage.getItem('termoWinStreak')) : 0;
    
    // Nossas novas variáveis de estado para a linha atual
    let currentGuessArray = Array(TAMANHO_PALAVRA).fill(''); // Ex: ['', '', '', '', '']
    let currentFocusIndex = 0; // Qual caixinha está em foco (0-4)
    
    winStreakCounter.textContent = winStreak;

    const keys = [
        "q w e r t y u i o p",
        "a s d f g h j k l",
        "enter z x c v b n m backspace"
    ];

    // --- Funções de Lógica de Foco e Digitação (NOVAS) ---
    
    function setFocus(index) {
        // Remove o foco antigo
        const oldTile = document.getElementById(`tile-${currentRow}-${currentFocusIndex}`);
        if (oldTile) oldTile.classList.remove('focused');
        
        // Define o novo foco
        currentFocusIndex = index;
        const newTile = document.getElementById(`tile-${currentRow}-${currentFocusIndex}`);
        if (newTile) newTile.classList.add('focused');
    }

    function addLetter(letter) {
        if (currentFocusIndex < TAMANHO_PALAVRA) {
            // Coloca a letra no array e na tela
            currentGuessArray[currentFocusIndex] = letter;
            const tile = document.getElementById(`tile-${currentRow}-${currentFocusIndex}`);
            tile.textContent = letter.toUpperCase();
            
            // Move o foco para a próxima caixinha
            setFocus(Math.min(currentFocusIndex + 1, TAMANHO_PALAVRA - 1));
        }
    }

    function deleteLetter() {
        if (currentFocusIndex < 0) return;

        // Se a caixinha atual tem uma letra, apaga
        if (currentGuessArray[currentFocusIndex] !== '') {
            currentGuessArray[currentFocusIndex] = '';
            const tile = document.getElementById(`tile-${currentRow}-${currentFocusIndex}`);
            tile.textContent = '';
        } 
        // Se a caixinha atual JÁ está vazia, move o foco para trás e apaga
        else if (currentFocusIndex > 0) {
            setFocus(currentFocusIndex - 1); // Move o foco
            currentGuessArray[currentFocusIndex] = ''; // Apaga a letra da nova caixinha
            const tile = document.getElementById(`tile-${currentRow}-${currentFocusIndex}`);
            tile.textContent = '';
        }
    }

    async function submitGuess() {
        if (gameStatus !== 'em_andamento') return;

        // Verifica se a palavra está completa
        if (currentGuessArray.some(letter => letter === '')) {
            showMessage("Palavra incompleta!");
            shakeRow(currentRow);
            return;
        }

        const guessString = currentGuessArray.join('');

        const response = await fetch('/termo/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ palavra: guessString })
        });
        const result = await response.json();

        if (!result.valido) {
            showMessage(result.mensagem);
            shakeRow(currentRow);
            return;
        }

        // Se o palpite for válido, aplica o feedback e passa para a próxima linha
        applyFeedback(result.palavra_exibida, result.feedback, currentRow);
        updateKeyboardColors(result.letras_usadas);

        gameStatus = result.status;
        currentRow++;
        
        if (gameStatus === 'vitoria' || gameStatus === 'derrota') {
            setFocus(-1); // Remove o foco
            finalizarJogo(result.status, result.palavra_secreta_final);
        } else {
            // Prepara a próxima linha
            currentGuessArray.fill('');
            setFocus(0);
            markRowAsCurrent();
        }
    }

    function handleKeyInput(key) {
        if (gameStatus !== 'em_andamento') return;
        key = key.toLowerCase();
        
        if (key === 'enter') {
            submitGuess();
        } else if (key === 'backspace' || key === '⌫') {
            deleteLetter();
        } else if (/^[a-zçáéíóúâêôãõü]$/i.test(key) && key.length === 1) {
            addLetter(key);
        }
    }

    // --- Funções de Interface (Atualizadas) ---

    function createGrid() {
        for (let i = 0; i < MAX_TENTATIVAS; i++) {
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.id = `tile-${i}-${j}`;
                
                // Adiciona o listener de clique para o foco
                tile.addEventListener('click', () => {
                    if (i === currentRow) {
                        setFocus(j);
                    }
                });
                grid.appendChild(tile);
            }
        }
    }

    function markRowAsCurrent() {
        // Marca todas as caixinhas da linha atual para o CSS
        for (let j = 0; j < TAMANHO_PALAVRA; j++) {
            const tile = document.getElementById(`tile-${currentRow}-${j}`);
            if (tile) tile.classList.add('current-row');
        }
    }

    function createKeyboard() { /* ... (Função igual à anterior) ... */ }
    function applyFeedback(palavraExibida, feedback, row) { /* ... (Função igual à anterior) ... */ }
    function updateKeyboardColors(letrasUsadas) { /* ... (Função igual à anterior) ... */ }
    function showMessage(msg, permanent = false) { /* ... (Função igual à anterior) ... */ }
    function shakeRow(row) { /* ... (Função igual à anterior) ... */ }
    function finalizarJogo(status, palavraSecreta) { /* ... (Função igual à anterior) ... */ }
    
    // --- Funções Completas (para garantir que não falte nada) ---
    function createKeyboard() {
        keys.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('keyboard-row');
            const letters = row.split(' ');
            letters.forEach(key => {
                const keyButton = document.createElement('button');
                keyButton.classList.add('key');
                keyButton.textContent = key === 'backspace' ? '⌫' : key;
                keyButton.dataset.key = key;
                if (key === 'enter' || key === 'backspace') {
                    keyButton.classList.add('large');
                }
                keyButton.addEventListener('click', () => handleKeyInput(key));
                rowDiv.appendChild(keyButton);
            });
            keyboardContainer.appendChild(rowDiv);
        });
    }
    function applyFeedback(palavraExibida, feedback, row) {
    // Remove a classe 'current-row' da linha que acabou de ser jogada
    for (let j = 0; j < TAMANHO_PALAVRA; j++) { // O loop usa 'j'
        const tile = document.getElementById(`tile-${row}-${j}`);
        if (!tile) continue; // Adiciona uma segurança
        
        tile.classList.remove('current-row', 'focused');
        tile.textContent = palavraExibida[j];
        
        setTimeout(() => {
            // --- CORREÇÃO AQUI ---
            tile.classList.add(feedback[j]); // <-- Trocado de 'i' para 'j'
        }, j * 150); // Delay crescente para efeito cascata
        
        tile.classList.add('flip'); // Adiciona animação de flip
    }
}
    function updateKeyboardColors(letrasUsadas) {
        document.querySelectorAll('.key').forEach(keyButton => {
            const key = keyButton.dataset.key;
            if (letrasUsadas.correct.includes(key)) {
                keyButton.className = 'key correct';
            } else if (letrasUsadas.present.includes(key)) {
                keyButton.className = 'key present';
            } else if (letrasUsadas.absent.includes(key)) {
                keyButton.className = 'key absent';
            }
        });
    }
    function showMessage(msg, permanent = false) {
        messageArea.textContent = msg;
        if (!permanent) {
            setTimeout(() => {
                if (messageArea.textContent === msg) {
                   messageArea.textContent = '';
                }
            }, 2000);
        }
    }
    function shakeRow(row) {
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            const tile = document.getElementById(`tile-${row}-${i}`);
            tile.classList.add('shake');
            setTimeout(() => tile.classList.remove('shake'), 600);
        }
    }
    function finalizarJogo(status, palavraSecreta) {
        if (status === 'vitoria') {
            winStreak++;
            modalTitle.textContent = "Parabéns, Você Venceu!";
        } else {
            winStreak = 0;
            modalTitle.textContent = "Que Pena, Você Perdeu!";
        }
        localStorage.setItem('termoWinStreak', winStreak);
        winStreakCounter.textContent = winStreak;
        modalStreak.innerHTML = `Vitórias seguidas: <strong>${winStreak}</strong>`;
        modalWord.textContent = palavraSecreta.toUpperCase();
        setTimeout(() => {
            endGameModal.style.display = 'flex';
        }, 1000);
    }
    playAgainButton.addEventListener('click', () => {
        window.location.reload(); 
    });

    // --- Inicialização ---
    createGrid();
    createKeyboard();
    fetch('/termo/start', { method: 'POST' });
    document.addEventListener('keydown', (event) => {
        handleKeyInput(event.key);
    });
    
    // Inicia o foco na primeira linha
    markRowAsCurrent();
    setFocus(0);
});