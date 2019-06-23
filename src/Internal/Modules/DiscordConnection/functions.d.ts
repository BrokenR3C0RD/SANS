import "../../Module";
import Discord from "discord.js";
import { Dictionary } from "../../Module";


/**
 * Handles a command.
 */
type CommandCallback = (
    /** The name of the command ran, without the bot prefix. */
    command: string,
    /** An array of space-separated arguments to the command. */
    args: string[],
    /** The user who ran the command. */
    user: Discord.GuildMember,
    /** The original message object, for extra information. */
    message: Discord.Message) => Promise<void>;

/**
 * Describes a command
 */
type CommandDescriptor = {
    /** The handler for this command when ran. */
    callback: CommandCallback,

    /** A description of the command. */
    description: string,

    /** Each argument and a description for each */
    arguments: Dictionary<string>,

    /** An example usage of the command with a description of its result. */
    usage: [string, string]
};

declare type name = "DiscordConnection";
declare module "../../Module" {
    /**
     * Does something magical
     * @param moduleName The name of the module providing the function.
     * @param functionName The name of the function to call.
     * @param args An
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "something", ...args: any[]): Promise<any>;
}