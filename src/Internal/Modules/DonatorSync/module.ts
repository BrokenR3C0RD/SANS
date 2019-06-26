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
    "DonatorSyncRole": "511076708519116800"
};

export = class DonatorSyncModule extends Module {
    public Name = "Donator Synchronization";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Identities": new Version(1, 0, 0)
    };
    public Functions = {}
    private syncsocket: net.Server;

    private sqlConfig: Config | null = null;
    private syncRole: string[] = [];
    private client: Discord.Client | null = null;
    private guild: Discord.Guild | null = null;

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);

        this.syncRole = (config["DonatorSyncRole"] as string).split(" ");
        const client = this.client = await ModuleCall("DiscordConnection", "GetClient");
        const guild = this.guild = await ModuleCall("DiscordConnection", "GetGuild") as Discord.Guild;

        this.syncsocket = net.createServer(socket => {
            socket.on("data", async data => {
                let users: string[] = JSON.parse(data.toString());
                logger.Info(`Got ${users.length} donators`);
                
                let infos = (await Promise.all(users.map(async id => await ModuleCall("FiveM-Identities", "GetUser", id)))).filter(user => !isNull(user)) as  UserInfo[];
                
                for(let user of infos){
                    let discord = user.identifiers.find(id => id.indexOf("discord:") == 0);
                    if(discord == null)
                        continue;
                    
                    let member = await guild.fetchMember(discord.substr(8));
                    await member.addRoles(this.syncRole);
                }

                logger.Info("Finished processing donators.");
            });
            socket.on("error", err => {
                logger.Error("Error in DonatorSync socket: " + err.stack);
            });
        });
        this.syncsocket.listen(9011);
    }

    public async Unload() {
        this.syncsocket.close();
    }
}