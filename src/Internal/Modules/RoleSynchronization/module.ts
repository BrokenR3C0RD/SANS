/*
    San Andreas State Bot
    FiveM role synchronization module
    (c) 2019 MasterR3C0RD
*/

import { promises as fs} from "fs";
import path from "path";
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus, CommandDescriptor, Logger } from "../../Module";
import Discord from "discord.js";
import { isNull } from "util";

const logger = global.logger;
const defaults = {
    "RoleSyncRefreshRole": "593121883130691605",
    "RoleSyncCodes": "547994887962755085 547994976487735316 547995176434401325 547995338783326239 564185054687920155 550132538295975937 536762091319853056",
    "RoleSyncWhitelist": "539859651865477141"
};

type CopRankTuple = [number, number];
type DepartmentData = {
    [id: string]: CopRankTuple
};

type StaffRoleData = {
    [id: string]: string[]
}

let parseDepartmentFile = function(data: string): DepartmentData {
    let lines = data.replace(/\r\n/g, "\n").replace(/\s*\#.*?\n/g, "\n").replace(/\n+/g, "\n").replace(/  /g, "\t").trim().split("\n");
    let output: DepartmentData = {};

    let deptid = 0;
    let rankid = 0;
    for(let i = 0; i < lines.length; i++){
        let line = lines[i].trimRight();
        let id = line.trim().split(" ")[0];

        if(line[0] !== "\t"){
            deptid = +id;
        } else if(line[1] !== "\t"){
            rankid = +id;
        } else {
            output[id] = [deptid, rankid];
        }
    }

    return output;
}

let parsePermissionsFile = function(data: string): StaffRoleData {
    let lines = data.replace(/\r\n/g, "\n").replace(/\s*\#.*?\n/g, "\n").replace(/\n+/g, "\n").replace(/    /g, "\t").trim().split("\n");
    let output: StaffRoleData = {};

    let roles: string[] = [];
    let resetRoles: boolean = false;

    for(let i = 0; i < lines.length; i++){
        let line = lines[i].trimRight();
        let id = line.trim().split(" ")[0];

        if(line[0] !== "\t"){
            if(resetRoles){
                roles = [];
                resetRoles = false;
            }
            
            roles.push(id);
        } else {
            resetRoles = true;
            roles.forEach(role => {
                output[role] = output[role] || [];
                output[role].push(id);
            });
        }
    }

    return output;
}

export = class RoleSynchronization extends Module {
    public Name = "Role Synchronization";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Identities": new Version(1, 0, 0)
    };
    public Functions = {}

    private refreshRole: string = "";
    private sqlConfig: Config | null = null;
    private departments: DepartmentData = {};
    private staff: StaffRoleData = {};
    private codes: string[] = [];
    private whitelist: string[] = [];

    private client: Discord.Client | null = null;
    private guild: Discord.Guild | null = null;
    private logchan: Discord.TextChannel | null = null;

    private commands: Dictionary<CommandDescriptor> = {
        "refreshperms": {
            callback: async (command, args, user, message) => {
                await message.reply("Reloading privileges. May take a few minutes...");
                await this.reloadPerms();
                await message.reply("Finished reloading all permissions.");
            },
            description: "Refreshes all user permissions. Must be a developer.",
            arguments: {},
            usage: [
                "%c",
                "If a developer runs this, refreshes all user permissions."
            ]
        }
    };

    private async reloadPerms(): Promise<void> {
        let departments = this.departments = parseDepartmentFile(await fs.readFile(path.join(__dirname, "Departments.txt"), "utf8"));
        let staff = this.staff = parsePermissionsFile(await fs.readFile(path.join(__dirname, "Permissions.txt"), "utf8"));
        let guild = <Discord.Guild> this.guild;
        await guild.fetchMembers();

        for(let key of guild.members)
            await this.applyRoles(key[1]);
    }

    private applyRoles = async (member: Discord.GuildMember, removedRoles: string[] = []) => {
        if(member.user.bot)
            return null;
        
        let user = await ModuleCall("FiveM-Identities", "GetUser", "discord:" + member.id);
        if(user == null)
            return null;
        
        let dept = this.departments[(member.roles.find(role => role.id in this.departments) || {id: null}).id] || [-1, -1];
        let perms = member.roles.filter(role => role.id in this.staff).map(role => this.staff[role.id]).reduce((out, perms) => out.concat(perms), []);
        let oldperms = await ModuleCall("FiveM-Identities", "GetPerms", user);

        for(let key in oldperms)
            if(oldperms[key] && perms.indexOf(key) == -1)
                await ModuleCall("FiveM-Identities", "DeletePerm", user, key);
            
        for(let perm of perms)
            await ModuleCall("FiveM-Identities", "SetPerm", user, perm, true);
        
        if(user.department[0] != dept[0] || user.department[1] != dept[1])
            await ModuleCall("FiveM-Identities", "SetDept", user, dept[0], dept[1]);
        
        let codes = this.codes.filter(code => member.roles.has(code));
        if(codes.length > 0){
            await member.removeRoles(codes);
            for(let i = 0; i < codes.length; i++)
                await ModuleCall("FiveM-Identities", "SetCode", user, this.codes.indexOf(codes[i]));
        }

        let whitelist = member.roles.find(role => this.whitelist.indexOf(role.id) != -1) ? 1 : removedRoles.find(role => this.whitelist.indexOf(role) != -1) ? -1 : 0;
        if(whitelist != 0)
            await ModuleCall("FiveM-Identities", "SetWhitelist", user, whitelist == 1 ? true : false);
        
        return {
            dept: dept,
            perms: perms.filter(perm => !oldperms[perm]),
            oldperms: Object.keys(oldperms).filter(perm => oldperms[perm] && perms.indexOf(perm) == -1),
            codes: codes,
            whitelist: whitelist
        };
    }

    private onMemberUpdate = (async (oldmem: Discord.GuildMember, newmem: Discord.GuildMember) => {
        let guild = <Discord.Guild>this.guild;
        
        let auditLogs = await guild.fetchAuditLogs({
            type: "MEMBER_ROLE_UPDATE"
        });
        let action = auditLogs.entries.filter(entry => (entry.target as Discord.User).id == oldmem.id).first();
        if(action == null || Date.now() - action.createdAt.getTime() >= 2000)
            return;

        let executor = action.executor;
        if(executor.id == guild.client.user.id) // Probably the bot removing the code, either way it's not of any use to us.
            return;
        
        if(oldmem.roles.equals(newmem.roles))
            return;

        let added = newmem.roles.filter(role => !oldmem.roles.has(role.id)).map(role => role.id);
        let removed = oldmem.roles.filter(role => !newmem.roles.has(role.id)).map(role => role.id);
        if(added.length == 0 && removed.filter(role => this.codes.indexOf(role) != -1).length == removed.length)
            return;
        
        let olduser = await ModuleCall("FiveM-Identities", "GetUser", "discord:" + newmem.id);
        if(olduser == null)
            return;
        
        let changes = await this.applyRoles(newmem, removed);

        if(changes == null)
            return;
        
        if(changes.perms.length == 0 && changes.oldperms.length == 0 && olduser.codes.length == changes.codes.length && olduser.department[0] == changes.dept[0] && olduser.department[1] == changes.dept[1] && changes.whitelist == 0)
            return;
        
        let embed = new Discord.RichEmbed();
        embed
            .setTitle(`User updated`)
            .setDescription(`*Changes to <@${newmem.id}> by <@${executor.id}>:*`)
            .addField("**Permissions:**", `${changes.perms.length} added, ${changes.oldperms.length} removed`)
            .setColor("WHITE")
            .setFooter("💀 SANS, By MasterR3C0RD");
        
        if(changes.codes.length > 0)
            embed.addField("**Snacks:**", `${changes.codes.length} changes`);
        if(olduser.department[0] != changes.dept[0] || olduser.department[1] !== changes.dept[1])
            embed.addField("**Department:**", `Dept ${changes.dept[0]}, rank ${changes.dept[1]}`);
        if(changes.whitelist != 0)
            embed.addField("**Whitelist status:**", changes.whitelist == 1 ? "Allowed" : "Denied");
        
        await (<Discord.TextChannel>this.logchan).send(embed);
    }).bind(this);

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        
        const config = await sql.GetValues(defaults);
        this.refreshRole = config["RoleSyncRefreshRole"] as string;
        this.codes = (config["RoleSyncCodes"] as string).split(" ");
        this.whitelist = (config["RoleSyncWhitelist"] as string).split(" ");

        this.client = await ModuleCall("DiscordConnection", "GetClient");
        this.guild = await ModuleCall("DiscordConnection", "GetGuild") || null;
        this.logchan = await ModuleCall("DiscordConnection", "GetLogChannel") || null;

        await this.reloadPerms();
        await ModuleCall("DiscordConnection", "RegisterCommands", this.commands);

        this.client.on("guildMemberUpdate", this.onMemberUpdate);
    }

    public async Unload() {
        let client = <Discord.Client> this.client;
        client.removeListener("guildMemberUpdate", this.onMemberUpdate);
    }
}