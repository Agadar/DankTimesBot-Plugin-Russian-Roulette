/**
 * Resembles a revolver used for Russian Roulette.
 */
export class Revolver {

    private readonly chambers: boolean[];
    private currentChamberIndex = 0;

    /**
     * Constructor.
     * @param cylinderSize The number of chambers in the cylinder.
     */
    constructor(cylinderSize: number) {
        this.chambers = new Array<boolean>(cylinderSize);
        for (let i = 0; i < cylinderSize; i++) {
            this.chambers[i] = false;
        }
    }

    /**
     * Spins the cylinder, causing it to end up at a random chamber.
     */
    public spinCylinder(): void {
        this.currentChamberIndex = Math.floor(Math.random() * this.chambers.length);
    }

    /**
     * Inserts a bullet into the revolver's cylinder in the next available chamber.
     * @return True if a bullet was loaded, or false if there were no more empty chambers.
     */
    public insertBullet(): boolean {
        for (let i = 0; i < this.chambers.length; i++) {
            if (!this.chambers[i]) {
                this.chambers[i] = true;
                return true;
            }
        }
        return false;
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
     * Empties all bullets from the cylinder.
     */
    public emptyCylinder(): void {
        for (let i = 0; i < this.chambers.length; i++) {
            this.chambers[i] = false;
        }
    }

    /**
     * The number of bullets in the cylinder.
     */
    public get bulletsInCylinder(): number {
        let count = 0;
        for (const chamber of this.chambers) {
            if (chamber) {
                count++;
            }
        }
        return count;
    }

    /**
     * The number of chambers in the cylinder.
     */
    public get chambersInCylinder(): number {
        return this.chambers.length;
    }
}
