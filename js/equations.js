const Equations = {
    // Aplica uma operação a um valor usando operador e operando
    apply(value, op, num) {
        if (!op) return value;
        num = parseInt(num);
        if (isNaN(num) && op !== '√') return value; // √ de cubos/quadrados pode ter num 2 ou 3
        
        switch (op) {
            case '+': return value + num;
            case '-': return value - num;
            case '×': return value * num;
            case '÷': return num !== 0 ? value / num : value;
            case '^': return Math.pow(value, num);
            case '√': 
                if (num === 3) return Math.cbrt(value);
                return Math.sqrt(value);
            case '%': return (value * num) / 100;
            default: return value;
        }
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
            // Potenciação (^)
            // No difícil, valor máximo 20 (20^2 = 400). No dificílimo, valor máximo 8 (8^3 = 512) para evitar extrapolação
            const maxValForPow = difficulty === 'hard' ? 20 : 8;
            if (currentValue > 1 && currentValue <= maxValForPow) ops.push('^');
            
            // Radiciação (√)
            if (currentValue > 1) {
                if (difficulty === 'hard' && Math.sqrt(currentValue) % 1 === 0) {
                    ops.push('√');
                } else if (difficulty === 'hardest' && Math.cbrt(currentValue) % 1 === 0) {
                    ops.push('√');
                }
            }
        }
        if (difficulty === 'hardest') {
            // Porcentagem (%)
            if (this.getValidPercentages(currentValue).length > 0) {
                ops.push('%');
            }
        }
        return ops[Math.floor(Math.random() * ops.length)];
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
            for (let i = 2; i <= Math.min(currentValue, 50); i++) {
                if (currentValue % i === 0) divisors.push(i);
            }
            return divisors.length > 0 ? divisors[Math.floor(Math.random() * divisors.length)] : 1;
        }
        if (op === '^') {
            if (difficulty === 'hard') return 2;
            if (difficulty === 'hardest') return 3;
            if (currentValue <= 4) return Math.random() < 0.5 ? 2 : 3;
            return 2;
        }
        if (op === '√') {
            if (difficulty === 'hard') return 2;
            if (difficulty === 'hardest') return 3;
            if (Math.cbrt(currentValue) % 1 === 0 && Math.sqrt(currentValue) % 1 === 0) {
                return Math.random() < 0.5 ? 2 : 3;
            }
            if (Math.cbrt(currentValue) % 1 === 0) return 3;
            return 2;
        }
        if (op === '%') {
            const valids = this.getValidPercentages(currentValue);
            return valids.length > 0 ? valids[Math.floor(Math.random() * valids.length)] : 50;
        }
        return 1;
    },

    // Gera um operador e operando distratores (para becos sem saída)
    generateWrongStep(currentValue, difficulty, targetValue) {
        let op = this.generateValidOpSymbol(currentValue, difficulty);
        let num = this.generateValidOperand(currentValue, op, difficulty);
        
        let attempts = 0;
        // Evita que leve diretamente ao alvo por acidente
        while (this.apply(currentValue, op, num) === targetValue && attempts < 10) {
            op = this.generateValidOpSymbol(currentValue, difficulty);
            num = this.generateValidOperand(currentValue, op, difficulty);
            attempts++;
        }
        return { op, num };
    }
};
