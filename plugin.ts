import { BotCommand } from "../../src/bot-commands/bot-command";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import {
  ChatMessagePluginEventArguments,
} from "../../src/plugin-host/plugin-events/event-arguments/chat-message-plugin-event-arguments";
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

  private readonly revolvers = new Map<number, Revolver>();

  constructor() {
    super("Russian Roulette", "1.0.0");
  }

  /**
   * @override
   */
  public getPluginSpecificCommands(): BotCommand[] {
    const infoCmd = new BotCommand(Plugin.INFO_CMD, "prints info about the Russian Roulette plugin",
      this.russianRouletteInfo.bind(this));
    const insertBulletCmd = new BotCommand(Plugin.INSERT_BULLET_CMD, "", this.handleInsertBullet.bind(this), false);
    const spinCylinderCmd = new BotCommand(Plugin.SPIN_CYLINDER_CMD, "", this.handleSpinCylinder.bind(this), false);
    const pullTriggerCmd = new BotCommand(Plugin.PULL_TRIGGER_CMD, "", this.handlePullTrigger.bind(this), false);
    const emptyCylinderCmd = new BotCommand(Plugin.EMPTY_CYLINDER_CMD, "", this.handleEmptyCylinder.bind(this), false);
    const bulletCountCmd = new BotCommand(Plugin.BULLETCOUNT_CMD, "", this.handleBulletCount.bind(this), false);
    return [infoCmd, insertBulletCmd, spinCylinderCmd, pullTriggerCmd, emptyCylinderCmd, bulletCountCmd];
  }

  private russianRouletteInfo(chat: Chat, user: User, msg: any, match: string[]): string {
    return "🔫 There are only two rules: if you blow your brains out, you lose ALL your points."
      + " If you survive, you earn points. Good luck.\n\n"
      + `/${Plugin.INSERT_BULLET_CMD} to insert a bullet into the cylinder\n`
      + `/${Plugin.SPIN_CYLINDER_CMD} to spin the cylinder\n`
      + `/${Plugin.PULL_TRIGGER_CMD} to put the revolver to your head and pull the trigger\n`
      + `/${Plugin.EMPTY_CYLINDER_CMD} to empty the cylinder\n`
      + `/${Plugin.BULLETCOUNT_CMD} to count the number of bullets in the cylinder`;
  }

  private handleInsertBullet(chat: Chat, user: User, msg: any, match: string[]): string {
    if (!this.userMayInteractWithRevolver(user)) { return; }
    const revolver = this.getOrCreateRevolver(chat.id);
    const insertedBullet = revolver.insertBullet();
    if (insertedBullet) {
      return "You carefully place a bullet into the cylinder.";
    } else {
      return "You see that the cylinder is already filled.";
    }
  }

  private handleSpinCylinder(chat: Chat, user: User, msg: any, match: string[]): string {
    if (!this.userMayInteractWithRevolver(user)) { return; }
    const revolver = this.getOrCreateRevolver(chat.id);
    revolver.spinCylinder();
    return "You wildly spin the cylinder. It slowly comes to a halt with a click.";
  }

  private handlePullTrigger(chat: Chat, user: User, msg: any, match: string[]): string {
    if (!this.userMayInteractWithRevolver(user)) { return; }
    const revolver = this.getOrCreateRevolver(chat.id);
    const potentialAward = this.calculatePotentialAward(user, revolver);
    const bulletFired = revolver.pullTrigger();

    if (bulletFired) {
      user.addToScore(-user.score);
      return "You slowly pull the trigger. Suddenly, the hammer comes down. A loud bang follows,"
        + " and the bullet shreds through your skull and brain, sending bloody pieces of bone and sludge everywhere"
        + ".\n\n💀 You have lost all of your points.";
    } else {
      user.addToScore(potentialAward);
      return "You slowly pull the trigger. Suddenly, the hammer comes down. Only a click follows.\n\n"
        + `😓 There was no bullet in the chamber. You've earned ${potentialAward} points and live to play another day.`;
    }
  }

  private handleEmptyCylinder(chat: Chat, user: User, msg: any, match: string[]): string {
    if (!this.userMayInteractWithRevolver(user)) { return; }
    const revolver = this.getOrCreateRevolver(chat.id);
    const bulletsInCylinder = revolver.bulletsInCylinder;
    revolver.emptyCylinder();
    return `You empty the cylinder. ${bulletsInCylinder} bullets fall to the ground.`;
  }

  private handleBulletCount(chat: Chat, user: User, msg: any, match: string[]): string {
    if (!this.userMayInteractWithRevolver(user)) { return; }
    const revolver = this.getOrCreateRevolver(chat.id);
    const bulletCount = revolver.bulletsInCylinder;
    return `There are currently ${bulletCount} bullets in the cylinder.`;
  }

  private getOrCreateRevolver(chatId: number): Revolver {
    if (!this.revolvers.has(chatId)) {
      this.revolvers.set(chatId, new Revolver(Plugin.DEFAULT_CYLINDER_SIZE));
    }
    return this.revolvers.get(chatId);
  }

  private userMayInteractWithRevolver(user: User): boolean {
    return user.score > 0;
  }

  private calculatePotentialAward(user: User, revolver: Revolver): number {
    if (revolver.bulletsInCylinder < 1) { return 0; }
    const scoreMultiplier = this.getScoreMultiplier(revolver);
    return Math.round(user.score * scoreMultiplier);
  }

  private getScoreMultiplier(revolver: Revolver): number {
    const oddsOfSurviving = 1 - (revolver.bulletsInCylinder / revolver.chambersInCylinder);
    const scoreMultiplier = (0.95 / oddsOfSurviving) - 1; // Gives house 5% advantage.
    return scoreMultiplier;
  }
}
