/*
    San Andreas State Bot
    Online member module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus } from "../../Module";
import { Guild } from "discord.js";

const logger = global.logger;
const defaults = {
    "OnlineMemberRole": "599051965632086037"
};

interface QueryPlayer {
    endpoint: string,
    id: number,
    identifiers: string[],
    name: string,
    ping: number
}

export = class BoilerplateModule extends Module {
    public Name = "Online Member";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 1);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Identities": new Version(1, 0, 0),
        "FiveM-Query": new Version(1, 0, 0)
    };
    public Functions = {}

    private sqlConfig: Config | null = null;
    private timer?: NodeJS.Timeout;
    private onlineRole: string = "";

    private timerCb = (async () => {
        try {
            let players: QueryPlayer[] = [];
            let servers = await ModuleCall("FiveM-Query", "AllowedServers");
            let guild = await ModuleCall("DiscordConnection", "GetGuild") as Guild;
            for(let key in servers){
                try {
                    let server = await ModuleCall("FiveM-Query", "GetServerInfo", key);
                    players = players.concat(server.players);
                } catch(e){
                    logger.Error("Failed to get players from " + key + ": " + e.message, "OnlineMember");
                }
            }
            await guild.fetchMembers();
            
            let ids: string[] = [];
            for(let player of players){
                try {
                    let user = await ModuleCall("FiveM-Identities", "GetUser", player.identifiers[0]);
                    if(user == null) continue;
                    
                    let discord = user.identifiers.filter(id => id.indexOf("discord:") == 0);
                    if(discord.length == 0) continue;

                    for(let id of discord){
                        let did = id.substr(8);
                        let member = guild.members.get(did);
                        if(member == null)
                            continue;
                        
                        if(!member.roles.has(this.onlineRole))
                            await member.addRole(this.onlineRole);

                        ids.push(did);
                    }
                } catch(e){
                    logger.Error("Failed to update online status for " + player.name + ": " + e.message, "OnlineMember");
                }
            }
            for(let [id, member] of guild.members.filter(member => ids.indexOf(member.id) == -1 && member.roles.has(this.onlineRole))){
                try {
                    await member.removeRole(this.onlineRole);
                } catch(e){
                    logger.Info("Failed to remove online role from " + member.displayName + ": " + e.message, "OnlineMember");
                }
            }
        } catch(e){
            logger.Error("Failed to update online users: " + e.message, "OnlineMember");
        }
    }).bind(this);

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);
        this.onlineRole = config["OnlineMemberRole"] as string;

        await this.timerCb();
        this.timer = setInterval(this.timerCb, 60000);
    }

    public async Unload() {
        clearInterval(this.timer as NodeJS.Timeout);
    }
}