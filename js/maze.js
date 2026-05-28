const MazeGen = {
    generate(rows, cols, startValue, difficulty) {
        // Inicializa o grid com o tipo correspondente à paridade
        const grid = Array(rows).fill().map((_, r) => Array(cols).fill().map((_, c) => {
            let type = 'number';
            if (r === 0 && c === 0) type = 'start';
            else if (r === rows - 1 && c === cols - 1) type = 'end';
            else if ((r + c) % 2 === 1) type = 'operator';

            return {
                type,
                value: null,
                visited: false,
                walls: { top: true, right: true, bottom: true, left: true },
                isPath: false,
                trap: null
            };
        }));

        // DFS para esculpir os caminhos (árvore geradora)
        const generateDFS = (r, c) => {
            const dirs = [
                { dr: -1, dc: 0, dir: 'top', opp: 'bottom' },
                { dr: 0, dc: 1, dir: 'right', opp: 'left' },
                { dr: 1, dc: 0, dir: 'bottom', opp: 'top' },
                { dr: 0, dc: -1, dir: 'left', opp: 'right' }
            ].sort(() => Math.random() - 0.5);

            grid[r][c].visited = true;

            for (let { dr, dc, dir, opp } of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
                    grid[r][c].walls[dir] = false;
                    grid[nr][nc].walls[opp] = false;
                    generateDFS(nr, nc);
                }
            }
        };

        generateDFS(0, 0);

        // Adiciona ciclos removendo paredes aleatórias para criar caminhos alternativos
        let extraPaths = difficulty === 'easy' ? 10 : (difficulty === 'medium' ? 24 : (difficulty === 'hard' ? 45 : 70));
        let attempts = 0;
        const oppDir = { 'top': 'bottom', 'bottom': 'top', 'right': 'left', 'left': 'right' };
        
        while (extraPaths > 0 && attempts < 150) {
            attempts++;
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            const dirs = ['top', 'right', 'bottom', 'left'];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            
            if (grid[r][c].walls[dir]) {
                const { dr, dc } = this.getDelta(dir);
                const nr = r + dr;
                const nc = c + dc;
                
                // Evita remover as bordas externas do labirinto
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    grid[r][c].walls[dir] = false;
                    grid[nr][nc].walls[oppDir[dir]] = false;
                    extraPaths--;
                }
            }
        }

        // Encontra o caminho principal único
        const mainPath = this.findPath(grid, 0, 0, rows - 1, cols - 1);
        
        // Define quais células pertencem ao caminho principal
        mainPath.forEach(p => {
            grid[p.r][p.c].isPath = true;
        });

        // 1. Preenche primeiro as células do caminho principal com a matemática correta
        let currentVal = startValue;
        grid[0][0].value = startValue;

        for (let i = 1; i < mainPath.length; i += 2) {
            const opCoord = mainPath[i];
            const numCoord = mainPath[i + 1];
            if (!numCoord) break;

            // Se o próximo bloco for a célula objetivo final
            if (numCoord.r === rows - 1 && numCoord.c === cols - 1) {
                // A célula final conterá o próprio valor alvo acumulado até aqui
                grid[opCoord.r][opCoord.c].value = Equations.generateValidOpSymbol(currentVal, difficulty);
                grid[numCoord.r][numCoord.c].value = currentVal;
                break;
            }

            const op = Equations.generateValidOpSymbol(currentVal, difficulty);
            const num = Equations.generateValidOperand(currentVal, op, difficulty);

            grid[opCoord.r][opCoord.c].value = op;
            grid[numCoord.r][numCoord.c].value = num;

            currentVal = Equations.apply(currentVal, op, num);
        }
        
        const targetValue = currentVal;

        // 2. Preenche o restante do labirinto (becos) de forma matematicamente consistente via BFS
        const bfsQueue = [{ r: 0, c: 0, val: startValue }];
        const bfsVisited = Array(rows).fill().map(() => Array(cols).fill(false));
        bfsVisited[0][0] = true;

        while (bfsQueue.length > 0) {
            const { r, c, val } = bfsQueue.shift();

            // Vizinhos abertos (operadores)
            const neighbors = this.getOpenNeighbors(grid, r, c);
            for (let opCoord of neighbors) {
                if (bfsVisited[opCoord.r][opCoord.c]) continue;
                bfsVisited[opCoord.r][opCoord.c] = true;

                // Se não tem valor (beco), gera um operador
                if (grid[opCoord.r][opCoord.c].value === null) {
                    grid[opCoord.r][opCoord.c].value = Equations.generateValidOpSymbol(val, difficulty);
                }
                const op = grid[opCoord.r][opCoord.c].value;

                // Destinos seguintes (números) a partir deste operador
                const numNeighbors = this.getOpenNeighbors(grid, opCoord.r, opCoord.c);
                for (let numCoord of numNeighbors) {
                    if (bfsVisited[numCoord.r][numCoord.c]) continue;
                    bfsVisited[numCoord.r][numCoord.c] = true;

                    // Se não tem valor (beco), gera um número distrator
                    if (grid[numCoord.r][numCoord.c].value === null) {
                        const wrongStep = Equations.generateWrongStep(val, difficulty, targetValue);
                        grid[numCoord.r][numCoord.c].value = wrongStep.num;
                    }
                    const num = grid[numCoord.r][numCoord.c].value;
                    const nextVal = Equations.apply(val, op, num);

                    bfsQueue.push({ r: numCoord.r, c: numCoord.c, val: nextVal });
                }
            }
        }

        // Adiciona Armadilhas nas células de número que não estão no caminho principal
        this.addTraps(grid, rows, cols, difficulty, mainPath);

        return { grid, targetValue };
    },

    findPath(grid, sr, sc, er, ec) {
        let path = [];
        let visited = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false));
        
        const dfs = (r, c, currentPath) => {
            if (r === er && c === ec) {
                path = [...currentPath, { r, c }];
                return true;
            }
            visited[r][c] = true;
            currentPath.push({ r, c });
            
            const dirs = ['top', 'right', 'bottom', 'left'];
            for (let dir of dirs) {
                if (!grid[r][c].walls[dir]) {
                    const { dr, dc } = this.getDelta(dir);
                    const nr = r + dr, nc = c + dc;
                    if (!visited[nr][nc]) {
                        if (dfs(nr, nc, currentPath)) return true;
                    }
                }
            }
            currentPath.pop();
            return false;
        };
        
        dfs(sr, sc, []);
        return path;
    },

    getOpenNeighbors(grid, r, c) {
        const neighbors = [];
        const dirs = ['top', 'right', 'bottom', 'left'];
        for (let dir of dirs) {
            if (!grid[r][c].walls[dir]) {
                const { dr, dc } = this.getDelta(dir);
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
                    neighbors.push({ r: nr, c: nc });
                }
            }
        }
        return neighbors;
    },

    getDelta(dir) {
        return {
            'top': { dr: -1, dc: 0 },
            'bottom': { dr: 1, dc: 0 },
            'left': { dr: 0, dc: -1 },
            'right': { dr: 0, dc: 1 }
        }[dir];
    },

    addTraps(grid, rows, cols, difficulty, mainPath) {
        let trapTypes = [];
        if (difficulty === 'easy') trapTypes = ['reset'];
        else if (difficulty === 'medium') trapTypes = ['reset', 'inverse'];
        else if (difficulty === 'hard') trapTypes = ['reset', 'inverse', 'mystery', 'time'];
        else trapTypes = ['reset', 'inverse', 'mystery', 'time', 'reset', 'inverse', 'time'];

        let possibleCells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isNumCell = grid[r][c].type === 'number';
                const inMainPath = mainPath.some(p => p.r === r && p.c === c);
                // Armadilhas apenas em células de número fora do caminho principal
                if (isNumCell && !inMainPath && (r !== 0 || c !== 0) && (r !== rows - 1 || c !== cols - 1)) {
                    possibleCells.push({ r, c });
                }
            }
        }
        
        possibleCells.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(trapTypes.length, possibleCells.length); i++) {
            const cell = possibleCells[i];
            grid[cell.r][cell.c].trap = trapTypes[i];
        }
    }
};
