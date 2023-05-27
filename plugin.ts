import TelegramBot from "node-telegram-bot-api";
import { BotCommand } from "../../src/bot-commands/bot-command";
import { AlterUserScoreArgs } from "../../src/chat/alter-user-score-args";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { Revolver } from "./revolver";

export class Plugin extends AbstractPlugin {

    private static readonly INFO_CMD = "russianroulette";
    private static readonly INSERT_BULLET_CMD = "insertbullet";
    private static readonly SPIN_CYLINDER_CMD = "spincylinder";
    private static readonly PULL_TRIGGER_CMD = "pulltrigger";
    private static readonly EMPTY_CYLINDER_CMD = "emptycylinder";
    private static readonly BULLETCOUNT_CMD = "bulletcount";

    private static readonly DEFAULT_CYLINDER_SIZE = 6;
    private static readonly CONSECUTIVE_PULL_MULTIPLIER = 0.25;

    private static readonly BULLET_IN_CYLINDER_REASON = "bullet.in.cylinder";
    private static readonly NO_BULLET_IN_CYLINDER_REASON = "no.bullet.in.cylinder";

    private readonly revolvers = new Map<number, Revolver>();
    private readonly consecutivePullMultipliers = new Map<number, number>();

    constructor() {
        super("Russian Roulette", "1.1.1");
    }

    /**
   * @override
   */
    public getPluginSpecificCommands(): BotCommand[] {
        const infoCmd = new BotCommand([Plugin.INFO_CMD], "prints info about the Russian Roulette plugin",
            this.russianRouletteInfo.bind(this));
        const insertBulletCmd = new BotCommand([Plugin.INSERT_BULLET_CMD], "", this.handleInsertBullet.bind(this), false);
        const spinCylinderCmd = new BotCommand([Plugin.SPIN_CYLINDER_CMD], "", this.handleSpinCylinder.bind(this), false);
        const pullTriggerCmd = new BotCommand([Plugin.PULL_TRIGGER_CMD], "", this.handlePullTrigger.bind(this), false);
        const emptyCylinderCmd = new BotCommand([Plugin.EMPTY_CYLINDER_CMD], "", this.handleEmptyCylinder.bind(this), false);
        const bulletCountCmd = new BotCommand([Plugin.BULLETCOUNT_CMD], "", this.handleBulletCount.bind(this), false);
        return [infoCmd, insertBulletCmd, spinCylinderCmd, pullTriggerCmd, emptyCylinderCmd, bulletCountCmd];
    }

    private russianRouletteInfo(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        return "🔫 There are only two rules: if you blow your brains out, you lose ALL your points."
      + " If you survive, you earn points. Good luck.\n\n"
      + `/${Plugin.INSERT_BULLET_CMD} to insert a bullet into the cylinder\n`
      + `/${Plugin.SPIN_CYLINDER_CMD} to spin the cylinder\n`
      + `/${Plugin.PULL_TRIGGER_CMD} to put the revolver to your head and pull the trigger\n`
      + `/${Plugin.EMPTY_CYLINDER_CMD} to empty the cylinder\n`
      + `/${Plugin.BULLETCOUNT_CMD} to count the number of bullets in the cylinder`;
    }

    private handleInsertBullet(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        this.resetMultipliers(chat.id);
        const revolver = this.getOrCreateRevolver(chat.id);
        const insertedBullet = revolver.insertBullet();
        if (insertedBullet) {
            return "You carefully place a bullet into the cylinder.";
        } else {
            return "You see that the cylinder is already filled.";
        }
    }

    private handleSpinCylinder(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        this.resetMultipliers(chat.id);
        const revolver = this.getOrCreateRevolver(chat.id);
        revolver.spinCylinder();
        return "You wildly spin the cylinder. It slowly comes to a halt with a click.";
    }

    private handlePullTrigger(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        if (!this.userMayInteractWithRevolver(user)) {
            return "😕 You don't have any points to bet. Go kill yourself in some other way," +
        " you depressed fuck.";
        }
        const revolver = this.getOrCreateRevolver(chat.id);

        if (revolver.bulletsInCylinder < 1) {
            return "🤷 The gun ain't loaded, champ. What's the point?";
        }
        const potentialAward = this.calculatePotentialAward(user, revolver);
        const bulletFired = revolver.pullTrigger();

        if (bulletFired) {
            this.resetMultipliers(chat.id);
            const alterScoreArgs = new AlterUserScoreArgs(user, -user.score, this.name, Plugin.BULLET_IN_CYLINDER_REASON);
            const scoreLost = chat.alterUserScore(alterScoreArgs);
            return "You slowly pull the trigger. Suddenly, the hammer comes down. A loud bang follows,"
        + " and the bullet shreds through your skull and brain, sending bloody pieces of bone and sludge everywhere"
        + `.\n\n💀 You have lost ${-scoreLost} points.`;
        } else {
            const consecutivePullMultiplier = this.getConsecutivePullMultiplier(chat.id);
            const alterScoreArgs = new AlterUserScoreArgs(user,
                Math.round(potentialAward * consecutivePullMultiplier), this.name, Plugin.NO_BULLET_IN_CYLINDER_REASON);
            const scoreWon = chat.alterUserScore(alterScoreArgs);
            return "You slowly pull the trigger. Suddenly, the hammer comes down. Only a click follows.\n\n"
        + `😓 There was no bullet in the chamber. You've earned ${scoreWon} points and live to play another day.\n\n`
        + `Consecutive pull multiplier: ${consecutivePullMultiplier}x`;
        }
    }

    private handleEmptyCylinder(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        this.resetMultipliers(chat.id);
        const revolver = this.getOrCreateRevolver(chat.id);
        const bulletsInCylinder = revolver.bulletsInCylinder;
        revolver.emptyCylinder();
        return `You empty the cylinder. ${bulletsInCylinder} bullets fall to the ground.`;
    }

    private handleBulletCount(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        const revolver = this.getOrCreateRevolver(chat.id);
        const bulletCount = revolver.bulletsInCylinder;
        return `There are currently ${bulletCount} bullets in the cylinder.`;
    }

    private getOrCreateRevolver(chatId: number): Revolver {
        let revolver = this.revolvers.get(chatId);
        if (!revolver) {
            revolver = new Revolver(Plugin.DEFAULT_CYLINDER_SIZE);
            this.revolvers.set(chatId, revolver);
        }
        return revolver;
    }

    private userMayInteractWithRevolver(user: User): boolean {
        return user.score > 0;
    }

    private calculatePotentialAward(user: User, revolver: Revolver): number {
        if (revolver.bulletsInCylinder < 1) { return 0; }
        const scoreMultiplier = this.getScoreMultiplier(revolver);
        return Math.max(Math.round(user.score * scoreMultiplier), 1);
    }

    private getScoreMultiplier(revolver: Revolver): number {
        const oddsOfSurviving = 1 - (revolver.bulletsInCylinder / revolver.chambersInCylinder);
        const scoreMultiplier = (0.95 / oddsOfSurviving) - 1; // Gives house 5% advantage.
        return scoreMultiplier;
    }

    private getConsecutivePullMultiplier(chatId: number): number {
        let multiplier = this.consecutivePullMultipliers.get(chatId);
        if (!multiplier && multiplier !== 0) {
            multiplier = 0;
            this.consecutivePullMultipliers.set(chatId, multiplier);
        } else {
            this.consecutivePullMultipliers.set(chatId, multiplier + 1);
        }
        return 1 + (Plugin.CONSECUTIVE_PULL_MULTIPLIER * multiplier);
    }

    private resetMultipliers(chatId: number) {
        this.consecutivePullMultipliers.set(chatId, 0);
    }
}
