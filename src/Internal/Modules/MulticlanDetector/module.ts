/*
    San Andreas State Bot
    Multiclan detection module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus } from "../../Module";
import Discord from "discord.js";
import { QueryPlayer, QueryAPI } from "../FiveM-Query/functions";

const logger = global.logger;
const defaults = {
    
};

let cleanName = function(name: string): string{
    return name.replace(/\^[0-9]/g, "");
};

export = class MulticlanDetectorModule extends Module {
    public Name = "Multiclan Detector";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Query": new Version(1, 0, 0),
        "FiveM-Identities": new Version(1, 0, 0)
    };
    public Functions = {}

    private sqlConfig: Config | null = null;
    private timer: NodeJS.Timeout | null = null;
    private logchan: Discord.TextChannel | null = null;

    private async checkMulticlan(){
        logger.Info("Checking for multiclanners...", "MulticlanDetector");
        let logchan = <Discord.TextChannel> this.logchan;
        let servers: QueryAPI[];

        try {
            servers = await ModuleCall("FiveM-Query", "GetAPIInfo");
        } catch(e){
            logger.Error("FiveM API failed. Missing multiclan check.", "MulticlanDetector");
            return;
        }
        let identifiers = await ModuleCall("FiveM-Identities", "GetWhitelistIDs");

        let dualclanservers = servers.map(server => {
            return {
                server: server,
                dualclanners: server.Data.players.filter(player => 
                    player.identifiers.find(
                        id => identifiers.indexOf(id) !== -1)
                    != null)
            }
        });

        let players: (QueryPlayer & {server: QueryAPI})[] = []
        for(let server of dualclanservers){
            if(await ModuleCall("FiveM-Query", "IsAllowedServer", server.server.EndPoint))
                continue;

            players = players.concat(server.dualclanners.map(player => {
                let x: any = player;
                x.server = server.server;
                return x;
            }));

        }
        if(players.length == 0)
            return logger.Info("No dual clanners detected.", "MulticlanDetector");
        
        let embed = new Discord.RichEmbed();
        embed.setTitle("Dual clan report:");
        embed.setDescription(`${players.length} player(s) on other servers:`);
        
        for(let player of players){
            let id = player.identifiers.find(id => identifiers.indexOf(id) != -1) as string;
            let user = await ModuleCall("FiveM-Identities", "GetUser", id);
            if(user == null){
                embed.addField(`**${id}**:`, "Not in SANS database.");
                continue;
            }
            let x: string | undefined;
            let discord = user.identifiers.find(id => id.indexOf("discord:") == 0) as string;
            embed.addField(`\`${user.names[0].name}\``, [
                `**(<@${discord.substr(8)}>)**`,
                `**UID:** ${user.uid}`,
                `**Server:**  \`${cleanName(player.server.Data.hostname)}\`(${player.server.EndPoint})`,
                `**Server whitelisted**: ${(x = player.server.Data.resources.find(resource => resource.toLowerCase().indexOf("whitelist") != -1)) ? `**__LIKELY (\`${x}\` plugin found)__**` : "Unlikely"}`
            ].join("\n"));
        }
        embed.setFooter("💀 SANS, By MasterR3C0RD");

        await logchan.send(embed);
        logger.Info("Multiclan report complete", "MulticlanDetector");
    }
    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);
        this.logchan = await ModuleCall("DiscordConnection", "GetLogChannel") as Discord.TextChannel;
        this.timer = setInterval(this.checkMulticlan.bind(this), 300000);

        await this.checkMulticlan();
    }

    public async Unload() {
        clearInterval(<NodeJS.Timeout> this.timer);
    }
}