import random
import unicodedata
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ====================================================================
# SEÇÃO 1: LÓGICA DO JOGO DA FORCA
# ====================================================================
FORCA_VISUAL = [ 
   """
       +-------+
       |       |
               |
               |
               |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
               |
               |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
       |       |
               |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
      /|       |
               |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
      /|\\      |
               |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
      /|\\      |
      /        |
               |
    =============""",
    """
       +-------+
       |       |
       O       |
      /|\\      |
      / \\      |
               |
    =============""",
    """
       +-------+
       |       |
      (O)      |
      /|\\      |
      / \\      |
               |
    =============""",
    """
       +-------+
       |       |
     .(O).     |
      /|\\      |
      / \\      |
               |
    =============""",
    """
       +-------+
       |       |
    --(O)--    |
      /|\\      |
      / \\      |
               |
    =============""",
    """
       +-------+
       |       |
    --(X)--    |
      /|\\      |
      / \\      |
               |
    ============="""
]
forca_game_state = {}
def forca_remover_acentos(texto):
    texto_normalizado = unicodedata.normalize('NFD', texto)
    return "".join(c for c in texto_normalizado if not unicodedata.combining(c))
def forca_iniciar_novo_jogo(tema, dificuldade):
    global forca_game_state
    try:
        with open(f"{tema}.txt", "r", encoding="utf-8") as arquivo:
            palavras = [p.strip().lower() for p in arquivo.readlines()]
        palavra_secreta = random.choice(palavras)
        if dificuldade == '1': max_erros = 10
        elif dificuldade == '3': max_erros = 6
        else: max_erros = 8
        forca_game_state = { "palavra_secreta": palavra_secreta, "palavra_sem_acento": forca_remover_acentos(palavra_secreta), "letras_acertadas": [letra if not letra.isalpha() else '_' for letra in palavra_secreta], "letras_tentadas": [], "erros": 0, "max_erros": max_erros, "dica": tema.capitalize(), "status": "em_andamento" }
        return True
    except FileNotFoundError:
        return False

# ====================================================================
# SEÇÃO 2: LÓGICA DO JOGO DA VELHA
# ====================================================================
jdv_game_state = {}
def jdv_verificar_vitoria(tabuleiro, jogador):
    # Verificar linhas
    for i in range(3):
        if all(tabuleiro[i][j] == jogador for j in range(3)): return f"linha_{i}"
    # Verificar colunas 
    for j in range(3):
        if all(tabuleiro[i][j] == jogador for i in range(3)): return f"coluna_{j}"
    # Verificar diagonais
    if all(tabuleiro[i][i] == jogador for i in range(3)): return "diagonal_0"
    if all(tabuleiro[i][2 - i] == jogador for i in range(3)): return "diagonal_1"
    return None
def jdv_verificar_empate(tabuleiro):
    return all(posicao != ' ' for linha in tabuleiro for posicao in linha)
def fazer_jogada_ia(tabuleiro):
    # lógica da IA da Velha
    for i in range(3):
        for j in range(3):
            if tabuleiro[i][j] == ' ':
                tabuleiro[i][j] = 'O';
                if jdv_verificar_vitoria(tabuleiro, 'O'): return
                tabuleiro[i][j] = ' '
    for i in range(3):
        for j in range(3):
            if tabuleiro[i][j] == ' ':
                tabuleiro[i][j] = 'X';
                if jdv_verificar_vitoria(tabuleiro, 'X'):
                    tabuleiro[i][j] = 'O'; return
                tabuleiro[i][j] = ' '
    if tabuleiro[1][1] == ' ': tabuleiro[1][1] = 'O'; return
    cantos = [(0, 0), (0, 2), (2, 0), (2, 2)]; random.shuffle(cantos)
    for i, j in cantos:
        if tabuleiro[i][j] == ' ': tabuleiro[i][j] = 'O'; return
    lados = [(0, 1), (1, 0), (1, 2), (2, 1)]; random.shuffle(lados)
    for i, j in lados:
        if tabuleiro[i][j] == ' ': tabuleiro[i][j] = 'O'; return
def jdv_iniciar_novo_jogo(modo):
    global jdv_game_state
    jdv_game_state = { "tabuleiro": [[' ' for _ in range(3)] for _ in range(3)], "jogador_atual": 'X', "status": "em_andamento", "vencedor": None, "modo": modo }

# ====================================================================
# SEÇÃO 3: LÓGICA DO JOGO DE DAMAS
# ====================================================================
damas_game_state = {}
def damas_criar_tabuleiro(): 
    tabuleiro = [];
    for i in range(8):
        linha = []
        for j in range(8):
            if (i + j) % 2 == 0: linha.append('#')
            else:
                if i < 3: linha.append('p')
                elif i > 4: linha.append('b')
                else: linha.append(' ')
        tabuleiro.append(linha)
    return tabuleiro
def damas_verificar_vitoria(tabuleiro, jogador_oponente):
    return not any(jogador_oponente in linha or jogador_oponente.upper() in linha for linha in tabuleiro)
def damas_iniciar_novo_jogo(modo):
    global damas_game_state
    damas_game_state = {"tabuleiro": damas_criar_tabuleiro(), "jogador_atual": 'b', "status": "em_andamento", "pecas_b": 12, "pecas_p": 12, "modo": modo}

def damas_encontrar_capturas_da_peca(l, c, tabuleiro, peca):
    capturas = []
    jogador_atual = peca.lower()
    oponente = 'p' if jogador_atual == 'b' else 'b'
    direcoes = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    if peca in ('b', 'p'):
        for dl, dc in direcoes:
            meio_l, meio_c = l + dl, c + dc
            dest_l, dest_c = l + (dl*2), c + (dc*2)
            if 0 <= dest_l <= 7 and 0 <= dest_c <= 7 and 0 <= meio_l <= 7 and 0 <= meio_c <= 7:
                if tabuleiro[meio_l][meio_c].lower() == oponente and tabuleiro[dest_l][dest_c] == ' ':
                    capturas.append(((l, c), (dest_l, dest_c)))
    elif peca in ('B', 'P'):
        for dl, dc in direcoes:
            nl, nc = l + dl, c + dc
            while 0 <= nl <= 7 and 0 <= nc <= 7:
                peca_encontrada = tabuleiro[nl][nc]
                if peca_encontrada.lower() == jogador_atual: break
                if peca_encontrada.lower() == oponente:
                    dest_l, dest_c = nl + dl, nc + dc
                    if 0 <= dest_l <= 7 and 0 <= dest_c <= 7 and tabuleiro[dest_l][dest_c] == ' ':
                        capturas.append(((l, c), (dest_l, dest_c)))
                    break
                nl, nc = nl + dl, nc + dc
    return capturas

def damas_encontrar_capturas_possiveis(jogador):
    todas_capturas = []
    for l in range(8):
        for c in range(8):
            peca = damas_game_state["tabuleiro"][l][c]
            if peca.lower() == jogador:
                todas_capturas.extend(damas_encontrar_capturas_da_peca(l, c, damas_game_state["tabuleiro"], peca))
    return todas_capturas

def damas_calcular_movimentos_validos(l, c):
    movimentos = []
    jogador_atual = damas_game_state["jogador_atual"]
    peca = damas_game_state["tabuleiro"][l][c]
    if peca.lower() != jogador_atual: return []
    capturas_obrigatorias = damas_encontrar_capturas_possiveis(jogador_atual)
    if capturas_obrigatorias:
        for origem, destino in capturas_obrigatorias:
            if origem == (l, c): movimentos.append(destino)
        return movimentos
    if peca in ('b', 'p'):
        direcao = -1 if peca == 'b' else 1
        for dc in [-1, 1]:
            nl, nc = l + direcao, c + dc
            if 0 <= nl <= 7 and 0 <= nc <= 7 and damas_game_state["tabuleiro"][nl][nc] == ' ':
                movimentos.append((nl, nc))
    elif peca in ('B', 'P'):
        for dl, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
            nl, nc = l + dl, c + dc
            while 0 <= nl <= 7 and 0 <= nc <= 7:
                if damas_game_state["tabuleiro"][nl][nc] == ' ': movimentos.append((nl, nc))
                else: break
                nl, nc = nl + dl, nc + dc
    return movimentos

def damas_validar_e_executar_movimento(l1, c1, l2, c2):
    tabuleiro = damas_game_state["tabuleiro"]; peca = tabuleiro[l1][c1]
    tabuleiro[l2][c2] = peca; tabuleiro[l1][c1] = ' '
    if (peca == 'b' and l2 == 0) or (peca == 'p' and l2 == 7):
        tabuleiro[l2][c2] = peca.upper()
    if abs(l1 - l2) >= 2:
        oponente = 'p' if damas_game_state["jogador_atual"] == 'b' else 'b'
        dl = 1 if l2 > l1 else -1; dc = 1 if c2 > c1 else -1
        l, c = l1 + dl, c1 + dc
        while l != l2:
            if tabuleiro[l][c].lower() == oponente:
                tabuleiro[l][c] = ' '
                if oponente == 'p': damas_game_state["pecas_p"] -= 1
                else: damas_game_state["pecas_b"] -= 1
                break
            l, c = l + dl, c + dc
    return True

def damas_fazer_jogada_ia():
    jogador_ia = 'p'
    while True:
        capturas = damas_encontrar_capturas_possiveis(jogador_ia)
        if capturas:
            movimento_escolhido = random.choice(capturas)
            (l1, c1), (l2, c2) = movimento_escolhido
            damas_validar_e_executar_movimento(l1, c1, l2, c2)
            novas_capturas = damas_encontrar_capturas_da_peca(l2, c2, damas_game_state["tabuleiro"], damas_game_state["tabuleiro"][l2][c2])
            if novas_capturas: damas_game_state["status"] = "captura_em_sequencia"; continue
            else: break
        else:
            movimentos_simples = []
            for l in range(8):
                for c in range(8):
                    if damas_game_state["tabuleiro"][l][c].lower() == jogador_ia:
                        validos = damas_calcular_movimentos_validos(l, c)
                        if validos:
                            for destino in validos: movimentos_simples.append(((l,c), destino))
            if not movimentos_simples: break
            (l1, c1), (l2, c2) = random.choice(movimentos_simples)
            damas_validar_e_executar_movimento(l1, c1, l2, c2)
            break

# ====================================================================
# SEÇÃO 4: LÓGICA DO JOGO TERMO 
# ====================================================================
termo_game_state = {}
TERMO_TAMANHO_PALAVRA = 5
TERMO_MAX_TENTATIVAS = 6
termo_palavras_resposta = set() # Palavras que podem ser a resposta
termo_palavras_aceitas_todas = set() # Todas as palavras válidas para palpite
termo_palavras_aceitas_normalizadas = set()

def termo_normalizar(palavra):
    nfkd_form = unicodedata.normalize('NFKD', palavra.lower())
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def termo_carregar_palavras():
    global termo_palavras_resposta, termo_palavras_aceitas_todas, termo_palavras_aceitas_normalizadas
    try:
        # Carrega a lista de respostas possíveis
        with open("termo_palavras.txt", "r", encoding="utf-8") as f_respostas:
            respostas = {linha.strip().lower() for linha in f_respostas if len(linha.strip()) == TERMO_TAMANHO_PALAVRA}
        termo_palavras_resposta = respostas

        # Carrega a lista completa de palavras aceitas
        with open("dicionario_5_letras.txt", "r", encoding="utf-8") as f_dicionario:
            aceitas = {linha.strip().lower() for linha in f_dicionario if len(linha.strip()) == TERMO_TAMANHO_PALAVRA}
        
        termo_palavras_aceitas_todas = respostas.union(aceitas)
        termo_palavras_aceitas_normalizadas = {termo_normalizar(p) for p in termo_palavras_aceitas_todas}
        
        print(f"Termo: Carregadas {len(termo_palavras_resposta)} palavras resposta e {len(termo_palavras_aceitas_todas)} palavras aceitas.")
        return True
    except FileNotFoundError as e:
        print(f"ERRO: Arquivo de palavras não encontrado: {e.filename}. Crie o arquivo {e.filename}.")
        if e.filename == 'termo_palavras.txt' and not termo_palavras_resposta:
            termo_palavras_resposta = {'termo', 'letra', 'jogar'} # fallback
        if e.filename == 'dicionario_5_letras.txt' and not termo_palavras_aceitas_todas:
            termo_palavras_aceitas_todas = {'termo', 'letra', 'jogar'} # fallback
        return True # Continua mesmo com erro, usando o fallback

def termo_comparar_palpites(palpite, palavra_secreta):
    feedback = [''] * TERMO_TAMANHO_PALAVRA; palavra_secreta_lista = list(palavra_secreta); palpite_lista = list(palpite)
    for i in range(TERMO_TAMANHO_PALAVRA):
        if palpite_lista[i] == palavra_secreta_lista[i]:
            feedback[i] = 'correct'; palavra_secreta_lista[i] = None; palpite_lista[i] = None
    for i in range(TERMO_TAMANHO_PALAVRA):
        if palpite_lista[i] is not None:
            try: 
                idx_na_secreta = palavra_secreta_lista.index(palpite_lista[i])
                feedback[i] = 'present'; palavra_secreta_lista[idx_na_secreta] = None
            except (ValueError, TypeError):
                feedback[i] = 'absent'
    return feedback

def termo_iniciar_novo_jogo():
    global termo_game_state
    if not termo_palavras_resposta:
        if not termo_carregar_palavras(): return False
    
    palavra_secreta_com_acento = random.choice(list(termo_palavras_aceitas_todas))
    palavra_secreta = termo_normalizar(palavra_secreta_com_acento)
    
    termo_game_state = { "palavra_secreta": palavra_secreta, "palavra_secreta_original": palavra_secreta_com_acento, "tentativas": [], "feedbacks": [], "tentativas_restantes": TERMO_MAX_TENTATIVAS, "status": "em_andamento", "letras_usadas": {"correct": set(), "present": set(), "absent": set()} }
    return True

# ====================================================================
# SEÇÃO 5: ROTAS DO SITE (PÁGINAS)
# ====================================================================
@app.route("/")
def menu_principal(): return render_template("index.html")
@app.route("/forca")
def pagina_forca(): return render_template("forca.html")
@app.route("/jogo-da-velha")
def pagina_jogo_da_velha(): return render_template("jogo_da_velha.html")
@app.route("/damas")
def pagina_damas(): return render_template("damas.html")
@app.route("/termo") # NOVA ROTA
def pagina_termo():
    return render_template("termo.html")

# ====================================================================
# SEÇÃO 6: APIs DOS JOGOS
# ====================================================================
# --- APIs da Forca e Jogo da Velha ---
@app.route("/start", methods=['POST'])
def forca_start_game(): # ...
    data = request.get_json(); sucesso = forca_iniciar_novo_jogo(data['theme'], data['difficulty'])
    if sucesso: return jsonify({ "palavra": forca_game_state["letras_acertadas"], "dica": forca_game_state["dica"], "letrasTentadas": forca_game_state["letras_tentadas"], "erros": forca_game_state["erros"], "max_erros": forca_game_state["max_erros"], "forca_visual": FORCA_VISUAL })
    else: return jsonify({"erro": "Arquivo de tema não encontrado"}), 404
@app.route("/guess", methods=['POST'])
def forca_guess_letter(): # ...
    data = request.get_json(); letra = data['letter'].lower()
    if forca_game_state["status"] != "em_andamento": return jsonify({"erro": "O jogo já terminou."}), 400
    if letra not in forca_game_state["letras_tentadas"]:
        forca_game_state["letras_tentadas"].append(letra)
        if letra in forca_game_state["palavra_sem_acento"]:
            for i, char_original in enumerate(forca_game_state["palavra_secreta"]):
                if forca_remover_acentos(char_original) == letra: forca_game_state["letras_acertadas"][i] = char_original
        else: forca_game_state["erros"] += 1
    if "_" not in forca_game_state["letras_acertadas"]: forca_game_state["status"] = "vitoria"
    elif forca_game_state["erros"] >= forca_game_state["max_erros"]: forca_game_state["status"] = "derrota"
    return jsonify({ "palavra": forca_game_state["letras_acertadas"], "letrasTentadas": forca_game_state["letras_tentadas"], "erros": forca_game_state["erros"], "status": forca_game_state["status"], "palavra_final": forca_game_state["palavra_secreta"] if forca_game_state["status"] != "em_andamento" else "", "dica": forca_game_state["dica"], "max_erros": forca_game_state["max_erros"] })
@app.route("/jdv/start", methods=['POST'])
def jdv_start_game(): # ...
    data = request.get_json(); jdv_iniciar_novo_jogo(data['mode']); return jsonify(jdv_game_state)
@app.route("/jdv/play", methods=['POST'])
def jdv_play_move(): # ...
    data = request.get_json(); linha, coluna = data['linha'], data['coluna']; jogador_humano = jdv_game_state["jogador_atual"]
    if jdv_game_state["tabuleiro"][linha][coluna] == ' ':
        jdv_game_state["tabuleiro"][linha][coluna] = jogador_humano
        tipo_vitoria = jdv_verificar_vitoria(jdv_game_state["tabuleiro"], jogador_humano)
        if tipo_vitoria: jdv_game_state["status"] = f"vitoria_{jogador_humano}"; jdv_game_state["vencedor"] = jogador_humano; jdv_game_state["linha_vitoria"] = tipo_vitoria
        elif jdv_verificar_empate(jdv_game_state["tabuleiro"]): jdv_game_state["status"] = "empate"
    if jdv_game_state["status"] == 'em_andamento':
        if jdv_game_state["modo"] == 'pvc':
            jdv_game_state["jogador_atual"] = 'O'; fazer_jogada_ia(jdv_game_state["tabuleiro"])
            vitoria_ia = jdv_verificar_vitoria(jdv_game_state["tabuleiro"], 'O')
            if vitoria_ia: jdv_game_state["status"] = "vitoria_O"; jdv_game_state["vencedor"] = 'O'; jdv_game_state["linha_vitoria"] = vitoria_ia
            elif jdv_verificar_empate(jdv_game_state["tabuleiro"]): jdv_game_state["status"] = "empate"
            else: jdv_game_state["jogador_atual"] = 'X'
        else: jdv_game_state["jogador_atual"] = 'O' if jogador_humano == 'X' else 'X'
    return jsonify(jdv_game_state)

# --- API DAMAS ---
@app.route("/damas/start", methods=['POST'])
def damas_start_game():
    data = request.get_json()
    damas_iniciar_novo_jogo(data['mode'])
    return jsonify(damas_game_state)

@app.route("/damas/move", methods=['POST'])
def damas_play_move():
    data = request.get_json()
    l1, c1 = data['origem']['linha'], data['origem']['coluna']
    l2, c2 = data['destino']['linha'], data['destino']['coluna']
    
    sucesso = damas_validar_e_executar_movimento(l1, c1, l2, c2)
    
    if sucesso:
        oponente = 'p' if damas_game_state["jogador_atual"] == 'b' else 'b'
        foi_captura = abs(l1 - l2) >= 2
        
        # Lógica de captura em sequência 
        if foi_captura:
            novas_capturas = damas_encontrar_capturas_da_peca(l2, c2, damas_game_state["tabuleiro"], damas_game_state["tabuleiro"][l2][c2])
            if novas_capturas:
                damas_game_state["status"] = "captura_em_sequencia"
            else: # Fim da sequência, passa o turno
                if damas_verificar_vitoria(damas_game_state["tabuleiro"], oponente):
                    damas_game_state["status"] = f"vitoria_{damas_game_state['jogador_atual']}"
                else:
                    damas_game_state["jogador_atual"] = oponente
                    damas_game_state["status"] = "em_andamento"
        else: # Movimento simples, passa o turno
            if damas_verificar_vitoria(damas_game_state["tabuleiro"], oponente):
                damas_game_state["status"] = f"vitoria_{damas_game_state['jogador_atual']}"
            else:
                damas_game_state["jogador_atual"] = oponente
    
    damas_game_state['ultima_jogada'] = {'l1': l1, 'c1': c1, 'l2': l2, 'c2': c2}
    return jsonify(damas_game_state)

@app.route("/damas/valid_moves", methods=['POST'])
def damas_get_valid_moves():
    data = request.get_json()
    linha, coluna = data['linha'], data['coluna']
    movimentos = damas_calcular_movimentos_validos(linha, coluna)
    return jsonify({"movimentos": movimentos})
    
@app.route("/damas/ia_move", methods=['POST'])
def damas_ia_move_endpoint():
    if damas_game_state["modo"] == 'pvc' and damas_game_state["jogador_atual"] == 'p' and damas_game_state["status"] == "em_andamento":
        damas_fazer_jogada_ia()
        if damas_verificar_vitoria(damas_game_state["tabuleiro"], 'b'):
            damas_game_state["status"] = "vitoria_p"
        else:
            damas_game_state["jogador_atual"] = 'b'
    return jsonify(damas_game_state)

# --- API TERMO  ---
@app.route("/termo/start", methods=['POST'])
def termo_start_game():
    sucesso = termo_iniciar_novo_jogo()
    if sucesso:
        return jsonify({
            "tentativas": termo_game_state["tentativas"],
            "feedbacks": termo_game_state["feedbacks"],
            "tentativas_restantes": termo_game_state["tentativas_restantes"],
            "status": termo_game_state["status"],
            "letras_usadas": {k: list(v) for k, v in termo_game_state["letras_usadas"].items()}
        })
    else:
        return jsonify({"erro": "Não foi possível carregar as palavras."}), 500

@app.route("/termo/guess", methods=['POST'])
def termo_make_guess():
    if termo_game_state["status"] != "em_andamento":
        return jsonify({"erro": "Jogo já finalizado."}), 400

    data = request.get_json()
    palpite_original = data.get('palavra', '')
    palpite_normalizado = termo_normalizar(palpite_original)

    if len(palpite_normalizado) != TERMO_TAMANHO_PALAVRA:
        return jsonify({"valido": False, "mensagem": f"A palavra deve ter {TERMO_TAMANHO_PALAVRA} letras."})
    
    palavra_para_exibir = palpite_original
    palpite_valido_encontrado = False

    # Validação (Ponto 1)
    if palpite_original.lower() in termo_palavras_aceitas_todas:
        palpite_valido_encontrado = True
        palavra_para_exibir = palpite_original
    elif palpite_normalizado in termo_palavras_aceitas_normalizadas:
        palpite_valido_encontrado = True
        # Encontra a palavra com acento correspondente para exibir
        try:
            palavra_para_exibir = next(p for p in termo_palavras_aceitas_todas if termo_normalizar(p) == palpite_normalizado)
        except StopIteration:
            palavra_para_exibir = palpite_original # Fallback
    
    if not palpite_valido_encontrado:
        return jsonify({"valido": False, "mensagem": "Palavra não reconhecida."})

    # Processa o palpite
    feedback = termo_comparar_palpites(palpite_normalizado, termo_game_state["palavra_secreta"])
    termo_game_state["tentativas"].append(list(palavra_para_exibir.upper()))
    termo_game_state["feedbacks"].append(feedback)
    termo_game_state["tentativas_restantes"] -= 1
    
    for i, letra in enumerate(palpite_normalizado):
        letra_norm = letra
        if feedback[i] == 'correct':
            termo_game_state["letras_usadas"]["correct"].add(letra_norm)
            if letra_norm in termo_game_state["letras_usadas"]["present"]: termo_game_state["letras_usadas"]["present"].remove(letra_norm)
        elif feedback[i] == 'present':
            if letra_norm not in termo_game_state["letras_usadas"]["correct"]: termo_game_state["letras_usadas"]["present"].add(letra_norm)
        else:
             if letra_norm not in termo_game_state["letras_usadas"]["correct"] and letra_norm not in termo_game_state["letras_usadas"]["present"]: termo_game_state["letras_usadas"]["absent"].add(letra_norm)
             
    if palpite_normalizado == termo_game_state["palavra_secreta"]: termo_game_state["status"] = "vitoria"
    elif termo_game_state["tentativas_restantes"] == 0: termo_game_state["status"] = "derrota"
    
    return jsonify({
        "valido": True,
        "palavra_exibida": list(palavra_para_exibir.upper()), # Envia a palavra com acento
        "feedback": feedback, # Envia só o feedback da última
        "tentativas_restantes": termo_game_state["tentativas_restantes"],
        "status": termo_game_state["status"],
        "palavra_secreta_final": termo_game_state["palavra_secreta_original"] if termo_game_state["status"] != "em_andamento" else None,
        "letras_usadas": {k: list(v) for k, v in termo_game_state["letras_usadas"].items()}
    })

# --- INICIA O SERVIDOR ---
if __name__ == "__main__":
    if termo_carregar_palavras(): # Carrega as palavras ANTES de iniciar o app
        app.run(debug=True)
    else:
        print("Não foi possível iniciar o servidor pois o arquivo de palavras do Termo não foi encontrado.")
