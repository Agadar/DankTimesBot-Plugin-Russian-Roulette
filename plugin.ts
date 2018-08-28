import { BotCommand } from "../../src/bot-commands/bot-command";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import {
  ChatMessagePluginEventArguments,
} from "../../src/plugin-host/plugin-events/event-arguments/chat-message-plugin-event-arguments";
import { PluginEvent } from "../../src/plugin-host/plugin-events/plugin-event-types";
import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { Revolver } from "./revolver";

export class Plugin extends AbstractPlugin {

  private static readonly INSERT_BULLET_CMD = "/insertbullet";
  private static readonly SPIN_BARREL_CMD = "/spinbarrel";
  private static readonly PULL_TRIGGER_CMD = "/pulltrigger";
  private static readonly EMPTY_BARREL_CMD = "/emptybarrel";

  private readonly revolvers = new Map<number, Revolver>();

  constructor() {
    super("Russian Roulette", "1.0.0");
    this.subscribeToPluginEvent(PluginEvent.ChatMessage, this.handleChatMessage.bind(this));
  }

  /**
   * @override
   */
  public getPluginSpecificCommands(): BotCommand[] {
    const russianRouletteInfoCommand = new BotCommand(
      "russianroulette", "prints info about the Russian Roulette plugin", this.russianRouletteInfo.bind(this));
    return [russianRouletteInfoCommand];
  }

  private handleChatMessage(eventArgs: ChatMessagePluginEventArguments): string {

    if (!eventArgs.msg.text) { return; }
    let returnMessage: string;

    if (eventArgs.msg.text === Plugin.INSERT_BULLET_CMD && this.userMayInteractWithRevolver(eventArgs.user)) {
      const revolver = this.getOrCreateRevolver(eventArgs.chat.id);
      returnMessage = this.handleInsertBullet(revolver);

    } else if (eventArgs.msg.text === Plugin.SPIN_BARREL_CMD && this.userMayInteractWithRevolver(eventArgs.user)) {
      const revolver = this.getOrCreateRevolver(eventArgs.chat.id);
      returnMessage = this.handleSpinBarrel(revolver);

    } else if (eventArgs.msg.text === Plugin.PULL_TRIGGER_CMD && this.userMayInteractWithRevolver(eventArgs.user)) {
      const revolver = this.getOrCreateRevolver(eventArgs.chat.id);
      returnMessage = this.handlePullTrigger(eventArgs.user, revolver);

    } else if (eventArgs.msg.text === Plugin.EMPTY_BARREL_CMD && this.userMayInteractWithRevolver(eventArgs.user)) {
      const revolver = this.getOrCreateRevolver(eventArgs.chat.id);
      returnMessage = this.handleEmptyBarrel(revolver);
    }

    return returnMessage;
  }

  private russianRouletteInfo(chat: Chat, user: User, msg: any, match: string[]): string {
    return `🔫 There is only one rule: if you blow your brains out, you lose ALL your points. Good luck. 🔫

    ${Plugin.INSERT_BULLET_CMD} to insert a bullet
    ${Plugin.SPIN_BARREL_CMD} to spin the barrel
    ${Plugin.PULL_TRIGGER_CMD} to put the gun to your head and pull the trigger
    ${Plugin.EMPTY_BARREL_CMD} to empty the barrel in case you're a big pansy`;
  }

  private getOrCreateRevolver(chatId: number): Revolver {
    if (!this.revolvers.has(chatId)) {
      this.revolvers.set(chatId, new Revolver());
    }
    return this.revolvers.get(chatId);
  }

  private userMayInteractWithRevolver(user: User): boolean {
    return user.score > 0;
  }

  private handleInsertBullet(revolver: Revolver) {
    const insertedBullet = revolver.insertBullet();
    if (insertedBullet) {
      return "You carefully place a bullet in the current chamber.";
    } else {
      return "You see that there's already a bullet in the current chamber.";
    }
  }

  private handleSpinBarrel(revolver: Revolver) {
    revolver.spinBarrel();
    return "You wildly spin the barrel. It slowly comes to a halt with a click.";
  }

  private handlePullTrigger(user: User, revolver: Revolver) {
    const bulletFired = revolver.pullTrigger();
    if (bulletFired) {
      user.resetScore();
      return "You slowly pull the trigger. Suddenly, the hammer comes down. A loud bang follows,"
        + " and the bullet shreds through your skull and brain, sending bloody pieces of bone and sludge everywhere"
        + ".\n\n💀 You have lost all of your points.";
    } else {
      return "You slowly pull the trigger. Suddenly, the hammer comes down. Only a click follows.\n\n"
        + "😓 There was no bullet in the chamber. You live to play another day.";
    }
  }

  private handleEmptyBarrel(revolver: Revolver) {
    revolver.emptyBarrel();
    return "You empty the barrel of all bullets. Pussy.";
  }
}
