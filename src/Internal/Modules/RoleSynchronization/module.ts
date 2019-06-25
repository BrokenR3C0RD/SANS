/*
    San Andreas State Bot
    FiveM role synchronization module
    (c) 2019 MasterR3C0RD
*/

import { promises as fs} from "fs";
import path from "path";
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus, CommandDescriptor } from "../../Module";
import Discord from "discord.js";

const logger = global.logger;
const defaults = {
    "RoleSyncRefreshRole": "593121883130691605",
    "RoleSyncCodes": "547994887962755085 547994976487735316 547995176434401325 547995338783326239 564185054687920155 550132538295975937 536762091319853056"
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

    private client: Discord.Client | null = null;
    private guild: Discord.Guild | null = null;

    private commands: Dictionary<CommandDescriptor> = {
        "refreshperms": {
            callback: async (command, args, user, message) => {
                await message.reply("Reloading privileges. May take a few minutes...");
                await this.reloadPerms();
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

        for(let i = 0; i < guild.members.size; i++){
            
        }
    }

    private async applyRoles(member: Discord.GuildMember, removedRoles?: Discord.Collection<string, Discord.Role>) {

    }

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);
        this.refreshRole = config["RoleSyncRefreshRole"] as string;
        await this.reloadPerms();
        await ModuleCall("DiscordConnection", "RegisterCommands", this.commands);
        this.client = await ModuleCall("DiscordConnection", "GetClient");
        this.guild = await ModuleCall("DiscordConnection", "GetGuild") || null;
    }

    public async Unload() {

    }
}