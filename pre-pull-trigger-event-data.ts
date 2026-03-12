import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";

/**
 * Event data for the plugin event fired when a user is about to pull the trigger.
 */
export interface PrePullTriggerEventData {
    /**
     * The chat in which the trigger pull is about to occur.
     */
    readonly chat: Chat;
    /**
     * The user that is about to pull the trigger.
     */
    readonly user: User;
    /**
     * Allows listening plugins to disallow the user from pulling the trigger.
     */
    allowTriggerPull: boolean;
}