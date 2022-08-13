export class Player {
    private consecutivePulls: number = 0;

    public constructor(public id: number) { }

    public getConsecutivePullMultiplier(): number {
        const pulls = this.consecutivePulls++;
        if (this.consecutivePulls === 5) {
            this.consecutivePulls = 0;
        }
        return 1 + (0.25 * pulls);
    }
}