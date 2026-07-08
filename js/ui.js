const UI = {
    // Selected piece symbol (default foguete)
    pieceSymbol: '🚀',
    // Initialize UI and set up piece selector listener
    init(game) {
        this.game = game;
        this.container = document.getElementById('maze-container');
        this.screens = document.querySelectorAll('.screen');
        
        // Initialize audio context for sound effects
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.beepGain = this.audioCtx.createGain();
        this.beepGain.gain.value = 0.2; // volume
        this.beepGain.connect(this.audioCtx.destination);
        
        // Helper to play a short beep
        this.playBeep = function(frequency = 440, duration = 100) {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = frequency;
            osc.connect(this.beepGain);
            osc.start();
            setTimeout(() => osc.stop(), duration);
        };
        
        // Buttons
        document.getElementById('btn-start').addEventListener('click', () => game.start());
        document.getElementById('btn-restart').addEventListener('click', () => game.resetToStart());
        document.getElementById('btn-back-to-menu').addEventListener('click', () => {
            this.playBeep(400, 100);
            if (confirm("Tem certeza que deseja sair do jogo atual e voltar ao menu inicial? Todo o seu progresso será perdido.")) {
                game.resetToStart();
            }
        });
        
        // Difficulty selectors
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                game.difficulty = e.target.dataset.level;
                this.playBeep(600, 80); // beep on difficulty change
            });
        });
        
        // Start value selectors
        const inputStart = document.getElementById('input-start-value');
        document.getElementById('btn-decrease').addEventListener('click', () => {
            inputStart.value = Math.max(1, parseInt(inputStart.value || 1) - 1);
            this.playBeep(500, 80);
        });
        document.getElementById('btn-increase').addEventListener('click', () => {
            inputStart.value = Math.min(99, parseInt(inputStart.value || 1) + 1);
            this.playBeep(500, 80);
        });
        
        // Store reference to piece selector radios and initialize piece symbol
        this.pieceRadios = document.querySelectorAll('input[name="piece"]');
        this.pieceRadios.forEach(r => {
            if (r.checked) this.pieceSymbol = r.value;
            r.addEventListener('change', (e) => {
                this.pieceSymbol = e.target.value;
            });
        });
        
        // Modal and equation elements
        this.mathModal = document.getElementById('math-modal');
        this.eqVal1 = document.getElementById('eq-val1');
        this.eqOp = document.getElementById('eq-op');
        this.eqVal2 = document.getElementById('eq-val2');
        this.eqAnswer = document.getElementById('eq-answer');
        this.btnSubmit = document.getElementById('btn-submit-answer');
    },
    // Sound helper methods
    playSuccess() { this.playBeep(1000, 200); },
    playError() { this.playBeep(300, 200); },
    playWin() { for (let i = 0; i < 3; i++) { setTimeout(() => this.playBeep(800 + i * 200, 150), i * 250); } },

    showScreen(screenId) {
        this.screens.forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    formatValue(val) {
        if (val === null || val === undefined) return '';
        return val.toString().replace(/\./g, ',');
    },

    updateHUD(start, current, target, timeStr) {
        document.getElementById('hud-start').innerText = this.formatValue(start);
        document.getElementById('hud-current').innerText = this.formatValue(current);
        document.getElementById('hud-target').innerText = this.formatValue(target);
        if (timeStr) document.getElementById('hud-time').innerText = timeStr;
    },

    renderMaze(mazeData, rows, cols, difficulty) {
        this.container.innerHTML = '';
        
        // Calcula o tamanho da célula responsivo baseado na largura da tela
        const containerWidth = Math.min(window.innerWidth - 32, 500); // 32px de margem de segurança
        const paddingAndGaps = 20 + (cols - 1) * 4;
        let cellSize = Math.floor((containerWidth - paddingAndGaps) / cols);
        cellSize = Math.min(cellSize, 50); // Máximo 50px
        cellSize = Math.max(cellSize, 32); // Mínimo 32px para legibilidade
        
        const gridEl = document.createElement('div');
        gridEl.className = 'maze-grid';
        gridEl.style.setProperty('--grid-cols', cols);
        gridEl.style.setProperty('--grid-rows', rows);
        gridEl.style.setProperty('--cell-size', `${cellSize}px`);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellData = mazeData[r][c];
                const cellEl = document.createElement('div');
                cellEl.className = `cell ${cellData.type}`;
                cellEl.id = `cell-${r}-${c}`;
                
                // Renderiza o valor apropriado na célula
                if (cellData.value !== null) {
                    if (cellData.type === 'end') {
                        const valStr = this.formatValue(cellData.value);
                        const isHard = difficulty === 'hard' || difficulty === 'hardest';
                        
                        let scale = 0.28;
                        if (isHard) {
                            if (valStr.length > 4) scale = 0.15;
                            else if (valStr.length > 2) scale = 0.19;
                            else scale = 0.24;
                        } else {
                            if (valStr.length > 4) scale = 0.18;
                            else if (valStr.length > 2) scale = 0.22;
                        }
                        
                        const trophyScale = isHard ? 0.26 : 0.32;
                        const lineSp = isHard ? '1.0' : '1.1';
                        const fontFamily = isHard ? 'var(--font-ui), sans-serif' : 'var(--font-math), monospace';
                        
                        cellEl.innerHTML = `<span style="font-size: calc(var(--cell-size) * ${trophyScale}); font-weight: 700; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: ${lineSp}; width: 100%; height: 100%; font-family: ${fontFamily}; overflow: hidden; white-space: nowrap;"><span>🏆</span><span style="font-size: calc(var(--cell-size) * ${scale}); font-weight: 900; color: var(--neon-green); text-shadow: 0 0 3px var(--neon-green);">${valStr}</span></span>`;
                    } else if (cellData.type === 'start') {
                        cellEl.innerText = cellData.value;
                    } else if (cellData.type === 'operator') {
                        cellEl.innerText = cellData.value;
                        if (cellData.value === '+') cellEl.classList.add('op-add');
                        else if (cellData.value === '-') cellEl.classList.add('op-sub');
                        else if (cellData.value === '×' || cellData.value === '*' || cellData.value === 'x') {
                            cellEl.classList.add('op-mul');
                            cellEl.innerText = ''; // Esvazia o texto para usar o pseudo-elemento ::before no CSS
                        }
                        else if (cellData.value === '÷' || cellData.value === '/') cellEl.classList.add('op-div');
                        else if (cellData.value === '^') {
                            cellEl.classList.add('op-pow');
                            if (difficulty === 'hardest') {
                                cellEl.innerText = '^3';
                            } else {
                                cellEl.innerText = '^2';
                            }
                        }
                        else if (cellData.value === '√') {
                            cellEl.classList.add('op-sqrt');
                        }
                        else if (cellData.value === '%') {
                            cellEl.classList.add('op-pct');
                        }
                        else if (cellData.value === '=') {
                            cellEl.classList.add('op-eq');
                        }
                    } else if (cellData.type === 'number') {
                        cellEl.innerText = cellData.value;
                    }
                }

                // Traps rendering
                if (cellData.trap) {
                    const trapIndicator = document.createElement('div');
                    trapIndicator.className = 'trap-indicator';
                    if (difficulty === 'easy') trapIndicator.classList.add('trap-visible');
                    else if (difficulty === 'medium') trapIndicator.classList.add('trap-semi');
                    cellEl.appendChild(trapIndicator);
                }

                // Gems rendering
                if (cellData.gem) {
                    const gemEl = document.createElement('div');
                    gemEl.className = 'gem-collectible';
                    gemEl.innerText = '💎';
                    cellEl.appendChild(gemEl);
                }

                // Renderiza pontes de conexão onde não há paredes
                if (!cellData.walls.right && c < cols - 1) {
                    const conn = document.createElement('div');
                    conn.className = 'connector-h';
                    cellEl.appendChild(conn);
                }
                if (!cellData.walls.bottom && r < rows - 1) {
                    const conn = document.createElement('div');
                    conn.className = 'connector-v';
                    cellEl.appendChild(conn);
                }

                gridEl.appendChild(cellEl);
            }
        }

        // Add Player
        const player = document.createElement('div');
        player.id = 'player';
        player.innerText = this.pieceSymbol; // usar símbolo escolhido
        if (this.pieceSymbol === '♞' || this.pieceSymbol === '🐴') {
            player.classList.add('is-knight');
        } else if (this.pieceSymbol === '🦄') {
            player.classList.add('is-unicorn');
        } else if (this.pieceSymbol === '👑') {
            player.classList.add('is-queen');
        }
        gridEl.appendChild(player);
        this.playerEl = player;

        this.container.appendChild(gridEl);
        this.updatePlayerPosition(0, 0);
    },

    updatePlayerPosition(r, c) {
        if (!this.playerEl) return;
        this.playerEl.style.setProperty('--player-r', r);
        this.playerEl.style.setProperty('--player-c', c);
        
        // Marcar trilha
        const cell = document.getElementById(`cell-${r}-${c}`);
        if(cell) {
            cell.classList.add('path');
        }
    },

    animateWrongMove() {
        this.container.classList.add('shake');
        setTimeout(() => this.container.classList.remove('shake'), 300);
    },

    animateTrap(trapType, newTotal) {
        const hudCurrent = document.getElementById('hud-current');
        hudCurrent.style.color = 'var(--neon-red)';
        
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = 0; flash.style.left = 0; flash.style.width = '100%'; flash.style.height = '100%';
        flash.style.zIndex = 100;
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.5s';
        
        if (trapType === 'reset') flash.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        else if (trapType === 'inverse') flash.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
        else if (trapType === 'mystery') flash.style.backgroundColor = 'rgba(200, 0, 255, 0.5)';
        else if (trapType === 'time') flash.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        
        document.body.appendChild(flash);
        setTimeout(() => flash.style.opacity = '0', 100);
        setTimeout(() => flash.remove(), 600);

        setTimeout(() => {
            hudCurrent.style.color = 'var(--text-yellow)';
        }, 1000);
    },

    showMathModal(val1, op, val2, onSubmitCallback) {
        // Formatação especial para exibição de potências e raízes
        if (op === '√') {
            this.eqVal1.innerText = '';
            this.eqOp.innerText = val2 === 3 ? '∛' : '√';
            this.eqVal2.innerText = this.formatValue(val1);
        } else if (op === '^') {
            this.eqVal1.innerText = this.formatValue(val1);
            this.eqOp.innerText = '^';
            this.eqVal2.innerText = this.formatValue(val2);
        } else if (op === '%') {
            this.eqVal1.innerText = this.formatValue(val2) + '%';
            this.eqOp.innerText = ' de ';
            this.eqVal2.innerText = this.formatValue(val1);
        } else {
            this.eqVal1.innerText = this.formatValue(val1);
            this.eqOp.innerText = op;
            this.eqVal2.innerText = this.formatValue(val2);
        }

        this.eqAnswer.value = '';
        this.mathModal.classList.add('active');
        
        // Foca o input de resposta
        setTimeout(() => this.eqAnswer.focus(), 150);

        // Remove handlers antigos para evitar acúmulo de listeners
        if (this._submitHandler) {
            this.btnSubmit.removeEventListener('click', this._submitHandler);
            this.eqAnswer.removeEventListener('keydown', this._keyHandler);
        }

        this._submitHandler = () => {
            const answer = parseFloat(this.eqAnswer.value.replace(',', '.'));
            if (isNaN(answer)) return;
            
            this.btnSubmit.removeEventListener('click', this._submitHandler);
            this.eqAnswer.removeEventListener('keydown', this._keyHandler);
            this._submitHandler = null;
            this._keyHandler = null;
            
            onSubmitCallback(answer);
        };

        this._keyHandler = (e) => {
            if (e.key === 'Enter') {
                this._submitHandler();
            }
        };

        this.btnSubmit.addEventListener('click', this._submitHandler);
        this.eqAnswer.addEventListener('keydown', this._keyHandler);
    },

    hideMathModal() {
        this.mathModal.classList.remove('active');
    },

    playGemaSound() {
        this.playBeep(1200, 100);
        setTimeout(() => this.playBeep(1600, 150), 100);
    },

    updateGemsHUD(count) {
        const gemsEl = document.getElementById('hud-gems');
        if (gemsEl) {
            gemsEl.innerText = count;
            gemsEl.classList.add('pulse');
            setTimeout(() => gemsEl.classList.remove('pulse'), 500);
        }
    },

    showWin({ timeStr, starsCount, trophy, achievements }) {
        this.showScreen('end-screen');
        
        // 1. Atualiza informações básicas
        document.getElementById('end-time-display').innerText = timeStr;
        document.getElementById('stars-container').innerText = '⭐'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
        
        if (starsCount === 3) {
            document.getElementById('end-message').innerText = "Missão Espacial Concluída com Perfeição!";
        } else if (starsCount === 2) {
            document.getElementById('end-message').innerText = "Missão Concluída! Você sobreviveu às anomalias.";
        } else {
            document.getElementById('end-message').innerText = "Missão Concluída! Cuidado com os limites de tempo.";
        }

        // 2. Renderiza o Troféu correspondente
        const trophyIcon = document.getElementById('trophy-icon');
        const trophyTitle = document.getElementById('trophy-title');
        
        // Limpa classes anteriores do troféu
        trophyIcon.className = 'trophy-glow';
        if (trophy === 'gold') {
            trophyIcon.innerText = '🏆';
            trophyIcon.classList.add('trophy-gold');
            trophyTitle.innerText = 'Troféu de Ouro';
        } else if (trophy === 'silver') {
            trophyIcon.innerText = '🥈';
            trophyIcon.classList.add('trophy-silver');
            trophyTitle.innerText = 'Troféu de Prata';
        } else {
            trophyIcon.innerText = '🥉';
            trophyIcon.classList.add('trophy-bronze');
            trophyTitle.innerText = 'Troféu de Bronze';
        }

        // 3. Renderiza Selos de Conquista Interativos
        const badgesContainer = document.getElementById('badges-container');
        badgesContainer.innerHTML = '';
        
        const badgeDefinitions = [
            { id: 'speed', name: 'Veloz e Furioso', emoji: '⏱️', desc: 'Tempo recorde' },
            { id: 'mind', name: 'Mente Brilhante', emoji: '🧠', desc: 'Zero erros' },
            { id: 'map', name: 'Cartógrafo', emoji: '📜', desc: 'Explorou >= 80%' }
        ];

        let selectedBadges = [];
        const selectedListEl = document.getElementById('selected-badges-list');
        selectedListEl.innerText = 'Nenhum selo selecionado';

        const updateSelectedDisplay = () => {
            if (selectedBadges.length === 0) {
                selectedListEl.innerText = 'Nenhum selo selecionado';
            } else {
                selectedListEl.innerText = selectedBadges.map(bId => {
                    const b = badgeDefinitions.find(x => x.id === bId);
                    return `${b.emoji} ${b.name}`;
                }).join('  |  ');
            }
        };

        badgeDefinitions.forEach(badge => {
            const isQualified = achievements.includes(badge.id);
            const card = document.createElement('div');
            card.className = `badge-card badge-${badge.id}`;
            if (isQualified) card.classList.add('enabled');

            card.innerHTML = `
                <span class="badge-emoji">${badge.emoji}</span>
                <span class="badge-name">${badge.name}</span>
                <span class="badge-status">${isQualified ? 'Habilitado' : 'Bloqueado'}</span>
            `;

            if (isQualified) {
                card.addEventListener('click', () => {
                    if (card.classList.contains('selected')) {
                        card.classList.remove('selected');
                        selectedBadges = selectedBadges.filter(id => id !== badge.id);
                    } else {
                        if (selectedBadges.length >= 2) {
                            // Limite atingido: remove o mais antigo selecionado para dar lugar ao novo
                            const oldestId = selectedBadges.shift();
                            const oldestCard = document.querySelector(`.badge-${oldestId}`);
                            if (oldestCard) oldestCard.classList.remove('selected');
                        }
                        card.classList.add('selected');
                        selectedBadges.push(badge.id);
                    }
                    updateSelectedDisplay();
                    this.playBeep(650, 70); // feedback de toque
                });
            }

            badgesContainer.appendChild(card);
        });
    }
};
