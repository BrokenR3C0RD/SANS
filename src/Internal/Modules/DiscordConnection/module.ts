/*
    San Andreas State Bot
    Discord connection library module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary } from "../../Module";
import Discord from "discord.js";

type CommandCallback = (
    command: string,
    args: string[],
    user: Discord.GuildMember,
    message: Discord.Message) => Promise<void>;

type CommandDescriptor = {
    callback: CommandCallback,
    description: string,
    arguments: Dictionary<string>,
    usage: [string, string]
};

const logger = global.logger;
const defaults = {
    "DiscordToken":      "Change me please",
    "DiscordOwner":      "227551426232975361",
    "DiscordGuild":      "392823287220142081",
    "DiscordLogChannel": "521483075985735703",
    "DiscordPrefix":     "s!"
};

function uptimePretty(): string {
    let started = global.loader.Started;
    let current = new Date();
    let difference = Math.floor((current.getTime() - started.getTime()) / 1000);
    
    let sec = 0,
        min = 0,
        hour = 0,
        day = 0,
        week = 0,
        mon = 0;
    
    sec = difference;
    if(sec >= 60){
        min = Math.floor(sec / 60);
        sec = sec % 60;
        
        if(min >= 60){
            hour = Math.floor(min / 60);
            min = min % 60;

            if(hour >= 24){
                day = Math.floor(hour / 60);
                hour = hour % 24;

                if(day >= 7){
                    week = Math.floor(day / 7);
                    day = day % 7;

                    if(week >= 4){
                        mon = Math.floor(week / 5);
                        week = week % 5;
                    }
                }
            }
        }
    }
    return Formatting.Format("%M%w%d%h%m%s", {
        M: mon  > 0 ? `${mon} month${ mon != 1 ? "s" : ""} `: "",
        w: week > 0 ? `${week} week${week != 1 ? "s" : ""} `: "",
        d: day  > 0 ? `${day} day${   day != 1 ? "s" : ""} `: "",
        h: hour > 0 ? `${hour} hour${hour != 1 ? "s" : ""} `: "",
        m: min  > 0 ? `${min} minute${min != 1 ? "s" : ""} `: "",
        s: sec  > 0 ? `${sec} second${sec != 1 ? "s" : ""} `: "",
    }).trim()
}

export = class DiscordConnectionModule extends Module {
    public Name = "Discord Connection Library";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);
    public Dependencies = {};
    public Functions = {
        GetClient: async (): Promise<Discord.Client> => <Discord.Client> this.client,
        GetLogChannel: async () => (<Discord.Client> this.client).channels.get(this.logchan),
        GetGuild: async () => (<Discord.Client> this.client).guilds.get(this.guild),
        IsOwner: async (member: Discord.GuildMember | Discord.User): Promise<boolean> => this.owner == member.id,

        AddCommand: async (name: string, descriptor: CommandDescriptor): Promise<void> => {
            this.commands[name] = descriptor;
        },
        Reply: async (message: Discord.Message, response: string): Promise<void> => {
            let client = <Discord.Client> this.client;
            let guild =  <Discord.Guild> client.guilds.get(message.guild.id);
            let channel = <Discord.TextChannel> guild.channels.get(message.channel.id);
            let msg = await channel.fetchMessage(message.id);
            await msg.reply(response);
        }
    }

    private sqlConfig: Config | null = null;

    private client:  Discord.Client | null = null;
    private owner:   string   = "";
    private guild:   string   = "";
    private logchan: string   = "";
    private prefix:  string   = "";
    
    private commands: Dictionary<CommandDescriptor> = {
        "help": {
            callback: async (command: string, args: string[], user: Discord.GuildMember, message: Discord.Message) => {
                let cmd = args[0] || "";
                if(cmd.indexOf(this.prefix) == 0)
                    cmd = cmd.substr(this.prefix.length);
                
                if(cmd == ""){
                    const response = new Discord.RichEmbed();
                    const cmds = Object.keys(this.commands);
                    response
                        .setTitle("help: List of commands")
                        .setColor("BLUE")
                        .setFooter("💀 SANS, *By MasterR3C0RD*");
                    
                    cmds.forEach(cmd => response.addField("**" + this.prefix + cmd + "**", this.commands[cmd].description, true));
                    await message.reply(response);
                } else if(cmd in this.commands) {
                    const response = new Discord.RichEmbed();
                    const desc = this.commands[cmd];
                    response
                        .setTitle("help: Help for __" + this.prefix + cmd + "__")
                        .setColor("GREEN")
                        .addField("**Description:**", desc.description, true)
                        .addField("**Arguments:**", Object.keys(desc.arguments).map(arg => `\\- **${arg}** - ${desc.arguments[arg]}`).join("\n"), true)
                        .addField("**Example:**", "__" + Formatting.Format(desc.usage[0], { "c": this.prefix + cmd }) + "__\n *-> " + desc.usage[1] + "*", true)
                        .setFooter("💀 SANS, *By MasterR3C0RD*");
                    
                    await message.reply(response);
                } else {
                    await message.reply("help: No such command: `" + cmd + "`")
                }
            },
            description: "Shows a list of commands or help for a specified command",
            arguments: {
                "command?": "A command to check usage of"
            },
            usage: [
                "%c help",
                "Shows this exact help response."
            ]
        },
        "load": {
            callback: async (command: string, args: string[], user: Discord.GuildMember, message: Discord.Message) => {
                if(this.owner == user.id){
                    let mod = args[0];
                    if(mod == null){
                        await message.reply("Please provide a module to load.");
                        return;
                    }
                    if(mod == "DiscordConnection"){
                        await message.reply("I'm already loaded, silly goose!");
                        return;
                    }

                    await ModuleCall("System", "LoadModule", mod);
                    let modu = <Module> LoadedModules[mod][0];
                    await message.reply("Loaded module **" + modu.Name + "** version " + modu.Version.toString());
                } else {
                    await message.reply("You are not the owner of the bot. The bot owner is: <@" + this.owner + ">");
                }
            },
            description: "Loads a module. Only usable by the bot owner",
            arguments: {
                "name": "The name of the module to load."
            },
            usage: ["%c Module1", "Loads a module named Module1"]
        },
        "unload": {
            callback: async (command: string, args: string[], user: Discord.GuildMember, message: Discord.Message) => {
                if(this.owner == user.id){
                    let mod = args[0];
                    if(mod == null){
                        await message.reply("Please provide a module to unload.");
                        return;
                    }
                    
                    if(mod == "DiscordConnection"){
                        await message.reply("You cannot unload DiscordConnection through DiscordConnection. That's too meta.");
                        return;
                    }
                    await ModuleCall("System", "UnloadModule", mod);
                    await message.reply("Unloaded module **" + mod + "**");
                } else {
                    await message.reply("You are not the owner of the bot. The bot owner is: <@" + this.owner + ">");
                }
            },
            description: "Unloads a module. Only usable by the bot owner",
            arguments: {
                "name": "The name of the module to unload."
            },
            usage: ["%c Module1", "Unloads a module named Module1"]
        },
        "reload": {
            callback: async (command: string, args: string[], user: Discord.GuildMember, message: Discord.Message) => {
                if(this.owner == user.id){
                    let mod = args[0];
                    if(mod == null){
                        await message.reply("Please provide a module to reload.");
                        return;
                    }
                    
                    if(mod == "System")
                        return;
                    
                    let unloaded = await global.loader.UnloadModule(mod);
                    let loaded = await Promise.all(unloaded.map(mod => global.loader.LoadModule(mod)));
                    let client = <Discord.Client> this.client;
                    
                    let modu = <Module> LoadedModules[mod][0];
                    if(mod !== "DiscordConnection")
                        await message.reply("Reloaded module **" + modu.Name + "** version " + modu.Version.toString());
                    else
                        await ModuleCall("DiscordConnection", "Reply", message, "Reloaded module **" + modu.Name + "** version " + modu.Version.toString());
                } else {
                    await message.reply("You are not the owner of the bot. The bot owner is: <@" + this.owner + ">");
                }
            },
            description: "Reloads a module. Only usable by the bot owner",
            arguments: {
                "name": "The name of the module to reload."
            },
            usage: ["%c Module1", "Reloads a module named Module1"]
        },
        "version": {
            callback: async (command: string, args: string[], user: Discord.GuildMember, message: Discord.Message) => {
                if(this.owner == user.id){
                    let resp = new Discord.RichEmbed();

                    let apiversion = global.loader.APIVersion;

                    resp
                        .setAuthor(`**SANS, implementing API v${apiversion.toString()}**`)
                        .setTitle("**Uptime**: " + uptimePretty())
                        .setColor("#7289DA")
                        .setThumbnail("https://www.dictionary.com/e/wp-content/uploads/2018/11/skull-emoji.png")
                        .setFooter("💀 SANS, By MasterR3C0RD");
                    
                    Object.keys(LoadedModules).forEach(name => {
                        let mod = <Module> LoadedModules[name][0];
                        resp.addField(`**${mod.Name}** by ${mod.Author}`, `*v${mod.Version.toString()}*`, true);
                    });

                    await message.reply(resp);
                } else {
                    await message.reply("You are not the owner of the bot. The bot owner is: <@" + this.owner + ">");
                }
            },
            description: "Retrieves version information. Only usable by the bot owner",
            arguments: {
            },
            usage: ["%c", "Retrieves version information if you're the owner."]
        }
    };

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);
        if(config["DiscordToken"] == "Change me please"){
            throw new Error("Please change the Discord bot token in the configuration.");
        }

        const token =                  <string> config["DiscordToken"];
        const owner =   this.owner =   <string> config["DiscordOwner"];
        const guild =   this.guild =   <string> config["DiscordGuild"];
        const logchan = this.logchan = <string> config["DiscordLogChannel"];
        const prefix  = this.prefix  = <string> config["DiscordPrefix"];

        const client = this.client = new Discord.Client({
            disabledEvents: [
                "TYPING_START"
            ]
        });
        client.on("message", async message => {
            if(message.guild.id !== this.guild || message.member == null)
                return;

            const msg = message.content.trim();
            logger.Debug("Received message: `" + JSON.stringify(msg) + "`");
            if(msg.indexOf(prefix) == 0){
                const parts = msg.split(" ");
                const command = parts[0].substr(prefix.length);

                if(command in this.commands)
                    await this.commands[command].callback(command, parts.slice(1), message.member, message);
                else
                    message.reply("No such command: `" + command + "`");
            }
        });

        client.on("error", err => {
            logger.Error("Discord error: " + err.stack);
            global.loader.UnloadModule("DiscordConnection");
        });
        await client.login(token);
        logger.Info("Connected to Discord as `" + client.user.username + "#" + client.user.discriminator + "`");
    }

    public async Unload() {
        if(this.client && this.client.status != 5)
            await this.client.destroy();
    }
}