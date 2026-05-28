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
            default: return value;
        }
    },

    // Retorna um operador válido com base no valor atual e dificuldade
    generateValidOpSymbol(currentValue, difficulty) {
        const ops = ['+', '-'];
        if (difficulty === 'medium' || difficulty === 'hard') {
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
        if (difficulty === 'hard') {
            // Potenciação (^)
            if (currentValue > 1 && currentValue <= 20) ops.push('^');
            // Radiciação (√)
            if (currentValue > 1 && (Math.sqrt(currentValue) % 1 === 0 || Math.cbrt(currentValue) % 1 === 0)) {
                ops.push('√');
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
            const multVal = Math.min(maxMult, difficulty === 'medium' ? 5 : 10);
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
            // Se o valor for menor ou igual a 4, aceita potência 3 (cubo), senão apenas potência 2 (quadrado)
            if (currentValue <= 4) return Math.random() < 0.5 ? 2 : 3;
            return 2;
        }
        if (op === '√') {
            if (Math.cbrt(currentValue) % 1 === 0 && Math.sqrt(currentValue) % 1 === 0) {
                return Math.random() < 0.5 ? 2 : 3;
            }
            if (Math.cbrt(currentValue) % 1 === 0) return 3;
            return 2;
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
