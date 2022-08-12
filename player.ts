export class Player {
    private consecutiveSpins: number = 0;

    public constructor(public id: number) { }

    public getConsecutiveSpinMultiplier(): number {
        const spins = this.consecutiveSpins++;
        if (this.consecutiveSpins === 5) {
            this.consecutiveSpins = 0;
        }
        return 1 + (0.5 * spins);
    }
}