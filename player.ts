export class Player {
    private consecutivePulls: number = 0;

    public constructor(public id: number) { }

    public getConsecutivePullMultiplier(): number {
        const spins = this.consecutivePulls++;
        if (this.consecutivePulls === 5) {
            this.consecutivePulls = 0;
        }
        return 1 + (0.5 * spins);
    }
}