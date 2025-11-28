export class Effect {
    constructor({ type, amount, duration, target }) {
        this.type = type;       // 'dot', 'hot', 'buff', 'debuff'
        this.amount = amount;   // damage/heal per turn
        this.duration = duration;
        this.target = target;   // 'self', 'ally', 'enemy', 'all-enemies', etc
    }

    tick(character) {
        if (this.duration <= 0) return null;

        if (this.type === "dot") {
            character.hp -= this.amount;
        }
        if (this.type === "hot") {
            character.hp += this.amount;
        }

        this.duration--;

        return this.duration > 0;
    }
}
