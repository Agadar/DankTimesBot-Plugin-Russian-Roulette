import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";

/**
 * Event data for the plugin event fired after a user pulled the trigger.
 */
export interface PostPullTriggerEventData {
    /**
     * The chat in which the trigger pull occurred.
     */
    readonly chat: Chat;
    /**
     * The user that pulled the trigger.
     */
    readonly user: User;
    /**
     * Indicates if the player 'died' because a bullet was chambered.
     */
    readonly playerDied: boolean;
}