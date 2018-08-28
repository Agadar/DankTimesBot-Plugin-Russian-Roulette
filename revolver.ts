/**
 * Resembles a revolver used for Russian Roulette.
 */
export class Revolver {

    private readonly chambers = [false, false, false, false, false, false];
    private currentChamberIndex = 0;

    /**
     * Spins the barrel, causing it to end up at a random chamber.
     */
    public spinBarrel(): void {
        this.currentChamberIndex = Math.floor(Math.random() * 6);
    }

    /**
     * Inserts a bullet into the revolver in the current chamber.
     * @return True if a bullet was loaded, or false if there was already a bullet in that chamber.
     */
    public insertBullet(): boolean {
        if (!this.chambers[this.currentChamberIndex]) {
            this.chambers[this.currentChamberIndex] = true;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Pulls the trigger, possibly resulting in a shot being fired.
     * @return True if a shot was fired, otherwise false.
     */
    public pullTrigger(): boolean {
        const bulletFired = this.chambers[this.currentChamberIndex];
        this.chambers[this.currentChamberIndex] = false;

        if (this.currentChamberIndex === this.chambers.length - 1) {
            this.currentChamberIndex = 0;
        } else {
            this.currentChamberIndex++;
        }
        return bulletFired;
    }

    /**
     * Empties all bullets from the barrel.
     */
    public emptyBarrel(): void {
        for (let i = 0; i < this.chambers.length; i++) {
            this.chambers[i] = false;
        }
    }
}
