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



type name = "DiscordConnection";

declare module "../../Module" {
    /**
     * Describes a command
     */
    export type CommandDescriptor = {
        /** The handler for this command when ran. */
        callback: CommandCallback,

        /** A description of the command. */
        description: string,

        /** Each argument and a description for each */
        arguments: Dictionary<string>,

        /** An example usage of the command with a description of its result. */
        usage: [string, string]
    };

    /**
     * Handles a command.
     */
    export type CommandCallback = (
        /** The name of the command ran, without the bot prefix. */
        command: string,
        /** An array of space-separated arguments to the command. */
        args: string[],
        /** The user who ran the command. */
        user: Discord.GuildMember,
        /** The original message object, for extra information. */
        message: Discord.Message) => Promise<void>;

    /**
     * Returns a copy to the Discord Client object.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `GetClient`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetClient"): Promise<Discord.Client>;

    /**
     * Returns an object representing the default log channel.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `GetLogChannel`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetLogChannel"): Promise<Discord.TextChannel | undefined>;

    /**
     * Returns an object representing the default guild (server).
     * @param moduleName The `DiscordConnection` module
     * @param functionName `GetGuild`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetGuild"): Promise<Discord.Guild | undefined>;

    /**
     * Returns true if the user is the owner.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `IsOwner`
     * @param user The user to test.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "IsOwner", user: Discord.GuildMember | Discord.User): Promise<boolean>;

    //AddCommand: async (name: string, descriptor: CommandDescriptor): Promise<void>

    /**
     * Adds a command along with information about it for the built-in help command.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `AddCommand`
     * @param name The name of the command, without a prefix.
     * @param descriptor An object describing the command and its usage.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "AddCommand", name: string, descriptor: CommandDescriptor): Promise<boolean>;

    /**
     * Adds multiple commands.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `RegisterCommands`
     * @param commands A dictionary of commands.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "RegisterCommands", commands: Dictionary<CommandDescriptor>): Promise<void>;

    /**
     * Unregisters commands.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `UnregisterCommands`
     * @param commands An array of commands to remove.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "UnregisterCommands", commands: string[]): Promise<void>;
}