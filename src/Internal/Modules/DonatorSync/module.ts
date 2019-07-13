/*
    San Andreas State Bot
    Donator Synchronization module
    (c) 2019 MasterR3C0RD
*/
import net from "net";
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus } from "../../Module";
import Discord from "discord.js";
import { isNull } from "util";
import { UserInfo } from "../FiveM-Identities/functions";

const logger = global.logger;
const defaults = {
    "DonatorSyncRole":     "511076708519116800",
    "DonatorSyncManage":   "593550134134964225",
    "DonatorSyncBastards": "593552534459645961",
    "DonatorSyncManageP":  "593552876270256146"
};

export = class DonatorSyncModule extends Module {
    public Name = "Donator Synchronization";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 1);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Identities": new Version(1, 0, 0)
    };
    public Functions = {}
    private syncsocket: net.Server | null = null;

    private sqlConfig: Config | null = null;
    private syncRole: string[] = [];
    private syncManage: string[] = []
    private syncPing: string[] = [];
    private bastChan: Discord.Channel | null = null;

    private client: Discord.Client | null = null;
    private guild: Discord.Guild | null = null;

    private async KillTheBastards(oldmem: Discord.GuildMember, newmem: Discord.GuildMember){
        const guild = <Discord.Guild> this.guild;
        const logChan = <Discord.TextChannel> this.bastChan;
        let auditLogs = await guild.fetchAuditLogs({
            type: "MEMBER_ROLE_UPDATE"
        });
        let entry = auditLogs.entries.filter(entry => (entry.target as Discord.User).id == newmem.id).first();
        let executor = await guild.fetchMember(entry.executor.id);
        if(this.syncManage.find(role => executor.roles.has(role)) != null || executor.id == guild.client.user.id)
            return;
        
        let m1 = this.syncPing.map(role => `<@&${role}>`).join(" ");
        let m2 = `<@!${newmem.id}>`;
        let m3 = `<@!${executor.id}>`;

        if(oldmem.roles.filter(role => this.syncRole.indexOf(role.id) != -1).size > 0 && newmem.roles.filter(role => this.syncRole.indexOf(role.id) != -1).size == 0){
            await newmem.addRoles(this.syncRole);
            await logChan.send(`${m1} ${m2}'s donator role was taken away illegally by ${m3}`);
        } else if(oldmem.roles.filter(role => this.syncRole.indexOf(role.id) != -1).size == 0 && newmem.roles.filter(role => this.syncRole.indexOf(role.id) != -1).size > 0){
            await newmem.removeRoles(this.syncRole);
            await logChan.send(`${m1} ${m2} was given the donator role illegally by ${m3}`);
        }
    }

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);

        const client = this.client = await ModuleCall("DiscordConnection", "GetClient") as Discord.Client;
        const guild = this.guild = await ModuleCall("DiscordConnection", "GetGuild") as Discord.Guild;
        this.syncRole = (config["DonatorSyncRole"] as string).split(" ");
        this.syncManage = (config["DonatorSyncManage"] as string).split(" ");
        this.syncPing = (config["DonatorSyncManageP"] as string).split(" ");
        this.bastChan = client.channels.get(config["DonatorSyncBastards"] as string) as Discord.TextChannel;

        client.on("guildMemberUpdate", this.KillTheBastards.bind(this));

        this.syncsocket = net.createServer(socket => {
            let packets: Buffer[] = [];
            socket.on("data", data => packets.push(data));
            socket.on("close", async () => {
                let data = Buffer.concat(packets);
                let users: string[];
                try {
                    users = JSON.parse(data.toString());
                    if(!(users instanceof Array) || typeof users[0] !== "string")
                        throw new Error("Was not string array.");
                    
                    logger.Info(`Got ${users.length} donators`, "DonatorSync");
                } catch(e){
                    logger.Error("Error when parsing donators: " + e.message, "DonatorSync");
                    return;
                }
                
                let infos = (await Promise.all(users.map(async id => await ModuleCall("FiveM-Identities", "GetUser", id)))).filter(user => !isNull(user)) as  UserInfo[];
                
                for(let user of infos){
                    let discord = user.identifiers.find(id => id.indexOf("discord:") == 0);
                    if(discord == null)
                        continue;
                    try {
                        let member = await guild.fetchMember(discord.substr(8));
                        let roles = this.syncRole.filter(role => !member.roles.has(role));
                        if(roles.length > 0)
                            await member.addRoles(roles);
                    } catch(e){
                        logger.Error("Error with user " + discord + ": " + e.message);
                    }
                }

                logger.Info("Finished processing donators.", "DonatorSync");
            });
            socket.on("error", err => {
                logger.Error("Error in DonatorSync socket: " + err.stack, "DonatorSync");
            });
        });
        this.syncsocket.listen(9011);
    }

    public async Unload() {
        (this.syncsocket as net.Server).close();
        (this.client as Discord.Client).removeListener("guildMemberUpdate", this.KillTheBastards.bind(this));
    }
}