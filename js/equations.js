const Equations = {
    // Aplica uma operação a um valor usando operador e operando
    apply(value, op, num) {
        if (!op) return value;
        num = parseFloat(num);
        if (isNaN(num) && op !== '√') return value; // √ de cubos/quadrados pode ter num 2 ou 3
        
        let result;
        switch (op) {
            case '+': result = value + num; break;
            case '-': result = value - num; break;
            case '×': result = value * num; break;
            case '÷': result = num !== 0 ? value / num : value; break;
            case '^': result = Math.pow(value, num); break;
            case '√': 
                if (num === 3) result = Math.cbrt(value);
                else result = Math.sqrt(value);
                break;
            case '%': result = (value * num) / 100; break;
            default: result = value;
        }
        // Evita dízimas estranhas do float (IEEE-754) e limita em no máximo 2 casas decimais
        return Math.round(result * 100) / 100;
    },

    // Retorna porcentagens padrão que resultam em valores inteiros para o valor atual
    getValidPercentages(value) {
        if (value <= 0) return [];
        // Porcentagens padrão amigáveis
        const pctOptions = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 150, 200];
        return pctOptions.filter(p => (value * p) % 100 === 0);
    },

    // Retorna um operador válido com base no valor atual e dificuldade
    generateValidOpSymbol(currentValue, difficulty) {
        const ops = ['+', '-'];
        if (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'hardest') {
            ops.push('×');
            // Só adiciona divisão se o valor atual tiver algum divisor válido além de 1
            let hasDivisor = false;
            for (let i = 2; i <= Math.min(currentValue, 20); i++) {
                if (currentValue % i === 0) {
                    hasDivisor = true;
                    break;
                }
            }
            if (hasDivisor) ops.push('÷');
        }
        if (difficulty === 'hard' || difficulty === 'hardest') {
            // Radiciação (√) — raiz quadrada e/ou cúbica dependendo do nível
            if (currentValue > 1) {
                if (Math.sqrt(currentValue) % 1 === 0) ops.push('√');
                if (difficulty === 'hardest' && Math.cbrt(currentValue) % 1 === 0) ops.push('√');
            }
        }
        if (difficulty === 'hard') {
            // Potenciação (^2) — valor máximo 25 para 25^2 = 625
            if (currentValue > 1 && currentValue <= 25) ops.push('^', '^');
        }
        if (difficulty === 'hardest') {
            // Potenciação (^3) — aumenta significativamente a chance de aparecer
            if (currentValue > 1 && currentValue <= 30) ops.push('^', '^', '^');
            // Porcentagem (%)
            if (this.getValidPercentages(currentValue).length > 0) {
                ops.push('%', '%');
            }
        }
        return ops[Math.floor(Math.random() * ops.length)];
    },

    // Filtra símbolos de operadores proibidos
    generateValidOpSymbolFiltered(currentValue, difficulty, forbiddenOps = []) {
        let op = this.generateValidOpSymbol(currentValue, difficulty);
        let attempts = 0;
        while (forbiddenOps.includes(op) && attempts < 20) {
            op = this.generateValidOpSymbol(currentValue, difficulty);
            attempts++;
        }
        if (forbiddenOps.includes(op)) {
            // Fallback caso todos os possíveis operadores sejam proibidos
            return Math.random() < 0.5 ? '+' : '-';
        }
        return op;
    },

    // Gera um operando (número) compatível com o operador e o valor atual
    generateValidOperand(currentValue, op, difficulty) {
        if (op === '+') {
            const max = difficulty === 'easy' ? 15 : (difficulty === 'medium' ? 30 : 50);
            return Math.floor(Math.random() * max) + 1;
        }
        if (op === '-') {
            const max = Math.min(currentValue - 1, difficulty === 'easy' ? 15 : (difficulty === 'medium' ? 30 : 50));
            return max > 0 ? Math.floor(Math.random() * max) + 1 : 1;
        }
        if (op === '×') {
            const maxMult = Math.max(2, Math.floor(200 / currentValue));
            const multVal = Math.min(maxMult, difficulty === 'medium' ? 5 : (difficulty === 'hard' ? 10 : 6));
            return multVal > 1 ? Math.floor(Math.random() * (multVal - 1)) + 2 : 2;
        }
        if (op === '÷') {
            const divisors = [];
            // Procuramos divisores de 2 a 20 que resultem em decimais exatos (no máximo 2 casas decimais)
            for (let i = 2; i <= 20; i++) {
                if (Math.round(currentValue * 100) % i === 0) {
                    divisors.push(i);
                }
            }
            return divisors.length > 0 ? divisors[Math.floor(Math.random() * divisors.length)] : 1;
        }
        if (op === '^') {
            if (difficulty === 'hard') return 2;
            if (difficulty === 'hardest') return Math.random() < 0.5 ? 2 : 3;
            if (currentValue <= 4) return Math.random() < 0.5 ? 2 : 3;
            return 2;
        }
        if (op === '√') {
            if (difficulty === 'hardest' && Math.cbrt(currentValue) % 1 === 0) {
                // Se o número for cubo perfeito, pode ser raiz cúbica. Se for quadrado e cubo (ex: 64), prioriza a cúbica no mais difícil
                return 3;
            }
            return 2; // Sempre raiz quadrada por padrão
        }
        if (op === '%') {
            const valids = this.getValidPercentages(currentValue);
            return valids.length > 0 ? valids[Math.floor(Math.random() * valids.length)] : 50;
        }
        return 1;
    },

    // Gera um operando distrator adequado para o operador fornecido
    generateWrongOperand(currentValue, op, difficulty, targetValue) {
        let num = this.generateValidOperand(currentValue, op, difficulty);
        let attempts = 0;
        // Evita que leve diretamente ao alvo por acidente
        while (this.apply(currentValue, op, num) === targetValue && attempts < 10) {
            num = this.generateValidOperand(currentValue, op, difficulty);
            attempts++;
        }
        return num;
    }
};
