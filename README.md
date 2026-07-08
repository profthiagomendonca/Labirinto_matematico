# 🧮 Labirinto Matemático

> Jogo educativo de labirinto com operações matemáticas — desenvolvido como parte de pesquisa de Mestrado.

---

## 🎮 Sobre o Projeto

**Labirinto Matemático** é um jogo digital interativo e de código aberto criado como recurso pedagógico para o ensino de operações matemáticas. Inspirado em passatempos matemáticos impressos, o jogo desafia o jogador a navegar por um labirinto de células numéricas e operadores, acumulando um valor exato para alcançar o objetivo final.

O projeto integra **design moderno com tema espacial neon**, **mecânicas de cálculo mental** e **progressão de dificuldade**, tornando o aprendizado de matemática mais envolvente e dinâmico para estudantes de diferentes faixas etárias.

---

## ✨ Funcionalidades

- 🗺️ **Labirinto gerado proceduralmente** a cada partida — nunca a mesma experiência duas vezes
- ➕ **Operações matemáticas progressivas**: soma e subtração (Fácil), multiplicação e divisão (Médio), potenciação e radiciação (Difícil)
- 🎯 **Valor-alvo visível na célula de chegada** — o jogador precisa acumular exatamente o valor do troféu `🏆`
- ↩️ **Retrocesso inteligente** — voltar no labirinto desfaz automaticamente o último cálculo, sem precisar recalcular
- 🔷 **Formas geométricas distintas por operador**: círculo, quadrado, losango, cápsula, escudo e hexágono — cada um com cor neon exclusiva
- 🚀🐴 **Escolha de personagem**: Foguete, Cavalo, Unicórnio ou Rainha, cada um com sua própria aura e animação de brilho neon customizadas
- 🔢 **Modal de cálculo interativo** — o jogador precisa resolver a equação antes de avançar
- ⏱️ **Cronômetro** com penalidade de +5 segundos a cada resposta errada
- 🔊 **Efeitos sonoros** sintetizados via Web Audio API (acerto, erro, vitória)
- 📱 **Suporte a gestos touch** — jogável em dispositivos móveis

---

## 📸 Visual

| Tela Inicial | Labirinto em Jogo |
|:---:|:---:|
| Seletor de dificuldade, valor inicial e personagem | Grid neon com operadores geométricos coloridos |

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica do jogo |
| **CSS3 Vanilla** | Design neon, animações, formas geométricas via `clip-path` e `border-radius` |
| **JavaScript (ES6+)** | Lógica do jogo, geração de labirinto (DFS + BFS), equações matemáticas |
| **Web Audio API** | Efeitos sonoros sintetizados sem arquivos externos |
| **Google Fonts** | Tipografia: *Outfit* + *Space Mono* |

---

## 🚀 Como Executar

Não requer instalação nem servidor. Basta clonar e abrir o arquivo:

```bash
git clone https://github.com/seu-usuario/labirinto-matematico.git
cd labirinto-matematico
# Abra o arquivo index.html no navegador
```

> ✅ Compatível com qualquer navegador moderno (Chrome, Firefox, Edge, Safari).

---

## 🎯 Regras do Jogo

1. Escolha o **valor inicial**, a **dificuldade** e o **personagem**.
2. Navegue pelo labirinto usando as **setas do teclado** ou **gestos de deslize** no celular.
3. Ao passar por uma célula de **operador** (ex: `+`, `-`, `×`), ele ficará pendente.
4. Ao avançar para uma célula de **número**, resolva a equação no modal para confirmar o movimento.
5. Se **voltar** pelo caminho, o último cálculo é desfeito automaticamente.
6. Chegue à célula do **troféu `🏆`** com exatamente o valor mostrado nela para **vencer**!

---

## 📐 Arquitetura

```
labirinto-matematico/
├── index.html          # Estrutura HTML e telas do jogo
├── style.css           # Todo o design, tema neon e animações
└── js/
    ├── constants.js    # Configurações globais
    ├── equations.js    # Geração e validação de equações matemáticas
    ├── maze.js         # Gerador de labirinto (DFS + BFS + armadilhas)
    ├── game.js         # Lógica de jogo, movimentação e estado
    └── ui.js           # Renderização, modal, HUD e efeitos sonoros
```

---

## 🎓 Contexto Acadêmico

Este jogo foi desenvolvido como parte de pesquisa de **Mestrado**, com o objetivo de estudar o impacto de jogos digitais educativos no aprendizado de matemática. A mecânica central é inspirada em passatempos matemáticos de labirinto presentes em literatura pedagógica impressa, adaptada para o ambiente digital com maior interatividade, feedback imediato e progressão de dificuldade.

---

## 📄 Licença

Este projeto é de uso acadêmico. Consulte o autor para permissões de uso e distribuição.
