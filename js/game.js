const Game = {
    init() {
        this.difficulty = 'easy';
        this.rows = 5;
        this.cols = 5;
        this.startValue = 12;
        this.targetValue = 0;
        this.currentValue = 12;
        this.pos = { r: 0, c: 0 };
        this.mazeData = null;
        this.timer = null;
        this.seconds = 0;
        this.isFrozen = false;
        
        this.pendingOperator = null; // Guarda o operador ao pisar em célula de operador
        this.valueHistory = [];      // Guarda histórico de valores para armadilha de inversão
        
        // Atributos de Gamificação
        this.gemsCollected = 0;
        this.errorsCount = 0;
        this.visitedCells = new Set();

        UI.init(this);
        this.bindInput();
    },

    start() {
        this.startValue = parseInt(document.getElementById('input-start-value').value) || 12;
        this.currentValue = this.startValue;
        this.pos = { r: 0, c: 0 };
        this.valueHistory = [];
        this.pathHistory = [{ r: 0, c: 0 }];
        this.pendingOperator = null;
        
        // Reset Gamificação
        this.gemsCollected = 0;
        this.errorsCount = 0;
        this.visitedCells = new Set(["0,0"]);
        
        if (this.difficulty === 'easy') { this.rows = 5; this.cols = 5; }
        else if (this.difficulty === 'medium') { this.rows = 7; this.cols = 7; }
        else { this.rows = 9; this.cols = 9; } // Difícil e Dificílimo 9x9 (cabe perfeitamente sem estourar)

        const gen = MazeGen.generate(this.rows, this.cols, this.startValue, this.difficulty);
        this.mazeData = gen.grid;
        this.targetValue = gen.targetValue;

        UI.renderMaze(this.mazeData, this.rows, this.cols, this.difficulty);
        UI.updateHUD(this.startValue, this.currentValue, this.targetValue, "00:00");
        UI.updateGemsHUD(0); // Inicia HUD com 0 gemas
        UI.showScreen('play-screen');

        this.seconds = 0;
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isFrozen) {
                this.seconds++;
                UI.updateHUD(this.startValue, this.currentValue, this.targetValue, this.formatTime(this.seconds));
            }
        }, 1000);
    },

    updatePosition(r, c) {
        this.pos.r = r;
        this.pos.c = c;
        this.visitedCells.add(`${r},${c}`);
        UI.updatePlayerPosition(r, c);
    },

    resetToStart() {
        UI.showScreen('start-screen');
        clearInterval(this.timer);
    },

    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (document.getElementById('play-screen').classList.contains('active') && !this.isFrozen) {
                switch(e.key) {
                    case 'ArrowUp': this.move('top'); break;
                    case 'ArrowRight': this.move('right'); break;
                    case 'ArrowDown': this.move('bottom'); break;
                    case 'ArrowLeft': this.move('left'); break;
                }
            }
        });
        
        // Mobile swipe
        let touchStartX = 0, touchStartY = 0;
        window.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        window.addEventListener('touchend', e => {
            if (document.getElementById('play-screen').classList.contains('active') && !this.isFrozen) {
                let dx = e.changedTouches[0].screenX - touchStartX;
                let dy = e.changedTouches[0].screenY - touchStartY;
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (Math.abs(dx) > 30) this.move(dx > 0 ? 'right' : 'left');
                } else {
                    if (Math.abs(dy) > 30) this.move(dy > 0 ? 'bottom' : 'top');
                }
            }
        });
    },

    move(dir) {
        const cell = this.mazeData[this.pos.r][this.pos.c];
        if (cell.walls[dir]) {
            UI.animateWrongMove();
            return;
        }

        const { dr, dc } = MazeGen.getDelta(dir);
        const nr = this.pos.r + dr;
        const nc = this.pos.c + dc;
        const nextCell = this.mazeData[nr][nc];

        // 1. Verifica se o jogador está voltando (desfazendo o caminho)
        const isBacktracking = this.pathHistory.length >= 2 && 
                               this.pathHistory[this.pathHistory.length - 2].r === nr && 
                               this.pathHistory[this.pathHistory.length - 2].c === nc;

        if (isBacktracking) {
            // Remove a célula atual do histórico do caminho (desfaz a visita)
            const currentCell = this.mazeData[this.pos.r][this.pos.c];
            this.pathHistory.pop();

            // Atualiza posição do jogador para a anterior
            this.updatePosition(nr, nc);

            // Se o jogador estava em uma célula de número comum ou de saída e voltou para um operador
            if (currentCell.type === 'number' || currentCell.type === 'end') {
                // Restaura o valor acumulado anterior da pilha
                if (this.valueHistory.length > 0) {
                    this.currentValue = this.valueHistory.pop();
                }
                // Como voltamos para o operador, definimos o pendingOperator correspondente
                this.pendingOperator = nextCell.value;
                UI.updateHUD(this.startValue, `${this.currentValue} ${this.pendingOperator} ...`, this.targetValue);
            } 
            // Se o jogador estava em uma célula de operador e voltou para um número (ou início)
            else if (currentCell.type === 'operator') {
                // Remove o operador pendente
                this.pendingOperator = null;
                UI.updateHUD(this.startValue, this.currentValue, this.targetValue);
            }

            UI.playSuccess(); // feedback sonoro de retorno bem-sucedido
            
            // Remove a classe de caminho (visual da trilha) da célula que foi abandonada
            const currentCellEl = document.getElementById(`cell-${currentCell.r}-${currentCell.c}`);
            if (currentCellEl) {
                currentCellEl.classList.remove('path');
            }
            return;
        }

        // 2. Movimento para frente normal
        // Se o próximo bloco for operador
        if (nextCell.type === 'operator') {
            this.pendingOperator = nextCell.value;

            // Segurança contra raízes irracionais: Se o operador for raiz (√) e o valor atual não for quadrado/cubo perfeito,
            // muda temporariamente para + ou - para evitar dízimas incalculáveis de cabeça.
            if (this.pendingOperator === '√') {
                const isSquare = Math.sqrt(this.currentValue) % 1 === 0;
                const isCube = Math.cbrt(this.currentValue) % 1 === 0;
                if (!isSquare && !isCube) {
                    this.pendingOperator = Math.random() < 0.5 ? '+' : '-';
                }
            }

            this.updatePosition(nr, nc);
            this.pathHistory.push({ r: nr, c: nc });

            // Atualiza o HUD mostrando o operador pendente (ex: "Atual: 12 + ...")
            UI.updateHUD(this.startValue, `${this.currentValue} ${this.pendingOperator} ...`, this.targetValue);
            this.checkCellState();
        } 
        // Se o próximo bloco for número comum
        else if (nextCell.type === 'number') {
            const val1 = this.currentValue;
            const op = this.pendingOperator || '+'; // Fallback
            
            // Impede tentar fazer conta com o sinal de '=' (que serve apenas para o troféu)
            if (op === '=') {
                UI.animateWrongMove();
                return;
            }

            const val2 = nextCell.value;
            const correctAnswer = Equations.apply(val1, op, val2);

            this.isFrozen = true; // Congela os controles enquanto resolve o cálculo

            UI.showMathModal(val1, op, val2, (playerAnswer) => {
                UI.hideMathModal();
                this.isFrozen = false;

                if (playerAnswer === correctAnswer) {
                    // Acertou a conta! Move, atualiza valor e registra histórico
                    this.updatePosition(nr, nc);
                    
                    this.valueHistory.push(this.currentValue);
                    this.pathHistory.push({ r: nr, c: nc });
                    this.currentValue = correctAnswer;
                    this.pendingOperator = null;

                    // Coleta gema se houver na célula
                    if (nextCell.gem) {
                        nextCell.gem = false;
                        this.gemsCollected++;
                        UI.playGemaSound();
                        UI.updateGemsHUD(this.gemsCollected);
                        const gemEl = document.querySelector(`#cell-${nr}-${nc} .gem-collectible`);
                        if (gemEl) gemEl.remove();
                    }

                    UI.updateHUD(this.startValue, this.currentValue, this.targetValue);
                    UI.playSuccess();
                    this.checkCellState();
                } else {
                    // Errou a conta: penalidade e tremor
                    this.seconds += 5; // Penalidade de +5s
                    this.errorsCount++; // Incrementa contador de erros
                    UI.animateWrongMove();
                    UI.updateHUD(this.startValue, this.currentValue, this.targetValue);
                    UI.playError();
                }
            });
        }
        // Se o próximo bloco for a célula objetivo final
        else if (nextCell.type === 'end') {
            // O jogador só pode entrar nela se já tiver acumulado exatamente o valor alvo (meta)
            if (this.currentValue === this.targetValue) {
                this.updatePosition(nr, nc);
                this.pendingOperator = null;
                this.pathHistory.push({ r: nr, c: nc });

                UI.updateHUD(this.startValue, this.currentValue, this.targetValue);
                UI.playSuccess();
                this.win();
            } else {
                // Se o valor acumulado estiver errado, não deixa entrar e sinaliza erro
                UI.animateWrongMove();
                UI.playError();
            }
        }
    },

    checkCellState() {
        const cell = this.mazeData[this.pos.r][this.pos.c];

        // Vitória
        if (cell.type === 'end') {
            if (this.currentValue === this.targetValue) {
                this.win();
            } else {
                // Chegou na saída com valor errado (ocorreu desvio no labirinto)
                UI.animateWrongMove();
            }
            return;
        }

        // Armadilhas (apenas disparadas em células de número/fim se configurado)
        if (cell.trap) {
            this.triggerTrap(cell.trap);
            cell.trap = null; // Desativa armadilha
            const trapEl = document.querySelector(`#cell-${this.pos.r}-${this.pos.c} .trap-indicator`);
            if (trapEl) trapEl.remove();
        }
    },

    triggerTrap(trapType) {
        if (trapType === 'reset') {
            this.currentValue = this.startValue;
            this.valueHistory = [];
        } 
        else if (trapType === 'inverse') {
            if (this.valueHistory.length > 0) {
                this.currentValue = this.valueHistory.pop();
            } else {
                this.currentValue = this.startValue;
            }
        }
        else if (trapType === 'mystery') {
            // Operação aleatória surpresa aplicada direto no total
            const op = Equations.generateValidOpSymbol(this.currentValue, this.difficulty);
            const num = Equations.generateValidOperand(this.currentValue, op, this.difficulty);
            this.currentValue = Equations.apply(this.currentValue, op, num);
        }
        else if (trapType === 'time') {
            this.seconds += 30; // Penalidade de tempo
            this.isFrozen = true;
            setTimeout(() => this.isFrozen = false, 3000); // Congela por 3s
        }

        UI.animateTrap(trapType, this.currentValue);
        UI.updateHUD(this.startValue, this.currentValue, this.targetValue);
    },

    win() {
        clearInterval(this.timer);
        
        let stars = 1;
        if (this.difficulty === 'easy') {
            if (this.seconds <= 60) stars = 3;
            else if (this.seconds <= 120) stars = 2;
        } else if (this.difficulty === 'medium') {
            if (this.seconds <= 120) stars = 3;
            else if (this.seconds <= 240) stars = 2;
        } else if (this.difficulty === 'hard') {
            if (this.seconds <= 240) stars = 3;
            else if (this.seconds <= 480) stars = 2;
        } else if (this.difficulty === 'hardest') {
            if (this.seconds <= 420) stars = 3;
            else if (this.seconds <= 840) stars = 2;
        }

        // Determina o Troféu correspondente
        let trophy = 'bronze';
        if (stars === 3) trophy = 'gold';
        else if (stars === 2) trophy = 'silver';

        // Determina Conquistas (Selos) habilitados
        const achievements = [];
        if (stars === 3) achievements.push('speed');
        if (this.errorsCount === 0) achievements.push('mind');
        
        const totalCells = this.rows * this.cols;
        const visitPercent = (this.visitedCells.size / totalCells) * 100;
        if (visitPercent >= 80) achievements.push('map');
        
        UI.showWin({
            timeStr: this.formatTime(this.seconds),
            starsCount: stars,
            trophy: trophy,
            achievements: achievements
        });
        UI.playWin();
    },

    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
};

window.onload = () => Game.init();
