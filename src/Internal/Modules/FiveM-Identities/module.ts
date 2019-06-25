/*
    San Andreas State Bot
    FiveM Identities Library module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus, CommandDescriptor } from "../../Module";
import MySQL from "mysql2/promise";
import Discord from "discord.js";
import { toDec } from "./BigHex";

const logger = global.logger;
const defaults = {
    "IdentityDatabase": "police",
    "IdentityLookupRoles": "592740982592634881",
    "IdentityLookupExtRoles": "592916067827843072"
};

interface UserName {
    name: string,
    lastUsed: Date
}

interface UserPlayTime {
    days: number,
    hours: number,
    minutes: number,
    seconds: number
}

interface UserInfo {
    uid: number,
    names: UserName[],
    playtime: {
        total: UserPlayTime,
        monthly: UserPlayTime,
        weekly: UserPlayTime
    },
    firstConnect: Date,
    lastConnect: Date,
    identifiers: string[],
    codes: number[],
    department: [number, number]
};

const DATE_FORMAT = "%A, %B %d, %Y, %I:%2M:%2S %a";

export = class FiveMIdentities extends Module {
    public Name = "FiveM Identities Library";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);

    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0),
        "FiveM-Query": new Version(1, 0, 0)
    };

    public Functions = {
        GetUser: async (id: string): Promise<UserInfo | null> => {
            const database = <MySQL.Connection> this.database;
            if(id.split(":")[0] == "server"){ // server:Public#5
                let part = id.split(":").slice(1).join(":");
                let parts = part.split("#");
                let ip = parts[0];
                let i = +parts[1];

                let server = await ModuleCall("FiveM-Query", "GetServerInfo", ip);
                let player = server.players.find(player => player.id == i);
                if(player == null)
                    return null;

                id = <string> player.identifiers.find(id => id.indexOf("license:") == 0);
            }

            let rows = <MySQL.RowDataPacket[]> (await database.query("SELECT users.uid AS uid, users.first_connect AS first_connect, users.last_connect AS last_connect, usernames.name AS name, usernames.last_used AS last_used FROM usernames LEFT JOIN users ON users.uid = usernames.uid WHERE usernames.uid = "
                + (isNaN(parseInt(id)) ? "(SELECT uid FROM userids WHERE id = ?)" : "?"), [
                    id
                ]))[0];
            
            if(rows[0] == null)
                return null;
            
            let uid: number = rows[0].uid;
            let first: Date = rows[0].first_connect;
            let last: Date = rows[0].last_connect;
            let names: UserName[] = rows.map(row => {
                return {
                    name: row.name,
                    lastUsed: row.last_used
                };
            }).sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf());

            let idrows = (<MySQL.RowDataPacket[][]>await database.query("SELECT userids.id, police.dept, police.rank FROM userids LEFT JOIN police ON userids.id = police.identifier WHERE uid = ?", [
                uid
            ]))[0];
            let identifiers = idrows.map(row => row.id);
            let deptrow = idrows.find(row => row.dept != null && row.rank != null) || { dept: -1, rank: -1 };
            let dept: [number, number] = [deptrow.dept as number, deptrow.rank as number];

            let total: UserPlayTime = ((<MySQL.RowDataPacket[][]>await database.query("SELECT days, hours, minutes, seconds FROM usertimes_total WHERE uid = ?", [uid]))[0].map(row => {
                return {
                    days: row.days,
                    hours: row.hours,
                    minutes: row.minutes,
                    seconds: row.seconds
                };
            })[0]) || {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                }

            let weekly: UserPlayTime = ((<MySQL.RowDataPacket[][]>await database.query("SELECT days, hours, minutes, seconds FROM usertimes_weekly WHERE uid = ?", [uid]))[0].map(row => {
                return {
                    days: row.days,
                    hours: row.hours,
                    minutes: row.minutes,
                    seconds: row.seconds
                };
            })[0]) || {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                }

            let monthly: UserPlayTime = ((<MySQL.RowDataPacket[][]>await database.query("SELECT days, hours, minutes, seconds FROM usertimes_monthly WHERE uid = ?", [uid]))[0].map(row => {
                return {
                    days: row.days,
                    hours: row.hours,
                    minutes: row.minutes,
                    seconds: row.seconds
                };
            })[0]) || {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                }

            let codes = (<MySQL.RowDataPacket[][]>await database.query("SELECT cd FROM usercodes WHERE uid = ?", [uid]))[0].map(row => row.cd);

            return {
                uid: uid,
                firstConnect: first,
                lastConnect: last,
                names: names,
                playtime: {
                    total: total,
                    monthly: monthly,
                    weekly: weekly
                },
                identifiers: identifiers,
                codes: codes,
                department: dept
            }
        },
        SetCode: async (user: UserInfo, code: number): Promise<void> => {
            const database = <MySQL.Connection>this.database;
            await database.query(
                user.codes.indexOf(code) !== -1
                    ? "DELETE FROM usercodes WHERE uid = ? AND cd = ?"
                    : "INSERT INTO usercodes (uid, cd) VALUES (?, ?)",
                [user.uid, code]);

            if (user.codes.indexOf(code) == -1)
                user.codes.push(code);
            else
                user.codes.splice(user.codes.indexOf(code), 1);
        },
        SetDept: async (user: UserInfo, deptid: number, rankid: number) => {
            const database = <MySQL.Connection>this.database;
            let id = <string>user.identifiers.find(id => id.indexOf("license:") == 0);
            await database.query("INSERT INTO police (identifier, dept, rank) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE dept = ?, rank = ?", [
                id,
                deptid, rankid,
                deptid, rankid
            ]);
        },
        SetPerm: async (user: UserInfo | null, perm: string, allow: boolean = true) => {
            const database = <MySQL.Connection>this.database;
            await database.query("INSERT INTO userpermissions (uid, node, allow) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE allow = ?", [
                user ? user.uid : 0,
                perm,
                allow,
                allow
            ]);
        }
    }

    private database: MySQL.Connection | null = null;
    private lookupRoles: string[] = [];
    private lookupExtRoles: string[] = [];


    private dept: Dictionary<string> = {
        0: "Fire Department",
        1: "Los Santos Police Department",
        2: "Sheriff's Department",
        3: "San Andreas State Troopers",
        4: "EMS Department",
        5: "San Andreas State Parks",
        6: "Federal Investigations Bureau"
    };
    private rank: Dictionary<string> = {
        0: "Trainee", 
        1: "Trainee", 
        2: "Trainee", 
        3: "Cadet", 

        4: "Fire Fighter",
        5: "Police Officer",
        6: "Deputy Sheriff",
        7: "Trooper",

        8: "Fire Fighter II",
        9: "Police Officer II",
        10: "Corporal",
        11: "Senior Trooper",

        12: "Sergeant", 
        13: "Sergeant", 
        14: "Sergeant", 
        15: "Sergeant", 

        16: "Lieutenant", 
        17: "Lieutenant", 
        18: "Lieutenant", 
        19: "Lieutenant", 

        20: "Captain", 
        21: "Captain", 
        22: "Captain", 
        23: "Captain", 

        24: "Asst Fire Chief",
        25: "Asst Chief of Police",
        26: "Under Sheriff",
        27: "Deputy Commissioner",

        28: "Fire Chief",
        29: "Police Chief",
        30: "Sheriff",
        31: "Commissioner",

        32: "Ranger",
        33: "Sen Ranger",
        34: "Head Ranger",

        35: "Field Officer I",
        36: "Field Officer II",
        37: "Field Officer III"
    };
    private codes: string[] = [
        "M&Ms",
        "Reese's",
        "Babe Ruth",
        "Jelly Belly",
        "Spongebob Gummy Hamburger",
        "Butterfinger",
        "Snickers"
    ];

    private commands: Dictionary<CommandDescriptor> = {
        "lookup": {
            callback: async (command, args, user, message) => {
                let id = args[0];
                if(id == null){
                    await message.reply("No user provided to look up.");
                    return;
                }
                let discord = /^<@([0-9]+)>$/.exec(id);
                if(discord){
                    id = "discord:" + discord[1];
                }
                
                try {
                    let user = await this.Functions.GetUser(id);
                    if(user == null){
                        await message.reply("User `" + id + "` could not be found.");
                        return;
                    }
                    
                    let embed = new Discord.RichEmbed();
                    let discord = user.identifiers.find(id => id.indexOf("discord:") == 0)
                    let name = user.names[0].name;

                    let rank = user.department;
                    let title = "";
                    if(rank[0] != -1 && rank[1] != -1)
                        title = this.dept[rank[0]] + " - " + this.rank[rank[1]];

                    embed
                        .setTitle("User lookup")
                        .setDescription("*Information for " + (discord ? "<@" + discord.substr(8) + ">" : "**" + name + "**") + (title.length > 0 ? ", " + title : "") + "*")
                        .addField("**First joined:**", Formatting.FormatTime(user.firstConnect, DATE_FORMAT))
                        .addField("**Last joined:**", Formatting.FormatTime(user.lastConnect, DATE_FORMAT))
                        .addField("**Total playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.total.days,
                            h: user.playtime.total.hours,
                            m: user.playtime.total.minutes,
                            s: user.playtime.total.seconds
                        }), true)
                        .addField("**Monthly playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.monthly.days,
                            h: user.playtime.monthly.hours,
                            m: user.playtime.monthly.minutes,
                            s: user.playtime.monthly.seconds
                        }), true)
                        .addField("**Weekly playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.weekly.days,
                            h: user.playtime.weekly.hours,
                            m: user.playtime.weekly.minutes,
                            s: user.playtime.weekly.seconds
                        }), true)
                        .setColor("GRAY")
                        .setFooter("All times are " + Formatting.FormatTime(user.firstConnect, "%Z") + " | 💀 SANS, By MasterR3C0RD");

                    await message.reply(embed);
                    await message.delete();
                } catch(e){
                    logger.Error(e.stack);
                    await message.reply("Failed to lookup `" + id + "`");
                }
            },
            description: "Looks up information about a user, like playtime.",
            arguments: {
                "user": "The user to check information for. Can be a FiveM identifier, their SANS UID, or a Discord mention"
            },
            usage: [
                "%c <@227551426232975361>",
                "Gets MasterR3C0RD's information."
            ]
        },
        "#lookup": {
            callback: async (command, args, user, message) => {
                const hasPermission = await ModuleCall("DiscordConnection", "IsOwner", user) || (this.lookupRoles.concat(this.lookupExtRoles)).reduce((acc, id) => user.roles.has(id) || acc, <boolean> false);
                if(!hasPermission){
                    await message.reply("You do not have permission to use this command.");
                    return;
                }
                const extra = await ModuleCall("DiscordConnection", "IsOwner", user) || this.lookupExtRoles.reduce((acc, id) => user.roles.has(id) || acc, <boolean> false);

                let id = args[0];
                let discord = /^<@([0-9]+)>$/.exec(id);
                if(discord){
                    id = "discord:" + discord[1];
                }
                
                try {
                    let user = await this.Functions.GetUser(id);
                    if(user == null){
                        await message.reply("User `" + id + "` could not be found.");
                        return;
                    }

                    let embed = new Discord.RichEmbed();
                    let discord = user.identifiers.find(id => id.indexOf("discord:") == 0)
                    let name = user.names[0].name;
                    let rank = user.department;
                    let title = "";
                    if(rank[0] != -1 && rank[1] != -1)
                        title = this.dept[rank[0]] + " - " + this.rank[rank[1]];

                    embed
                        .setTitle("Admin user lookup")
                        .setDescription(`*Information for ${(discord ? "<@" + discord.substr(8) + ">" : "**" + name + "**")} ${(title.length > 0 ? ", " + title : "")} (UID ${user.uid})*`)
                        .addField("**Username history:**", user.names.map(name => {
                            return `**${name.name}** (${Formatting.FormatTime(name.lastUsed, DATE_FORMAT)})`;
                        }).slice(0, 5).join("\n"))
                        .addField("**Identifiers:**", user.identifiers.filter(id => id.indexOf("ip:") === -1).map(part => {
                            let parts = part.split(":");
                            let type = parts[0];
                            let id = parts[1];
                            switch(type){
                                case "discord":
                                    return `**${type}**:${id} (<@${id}>)`;
                                case "steam":
                                    return `**${type}**:${id} ([Link](https://steamcommunity.com/profiles/${toDec(id)}))`;
                                default:
                                    return `**${type}**:${id}`;
                            }
                        }).sort().slice(0, 8).join("\n"))
                        .addField("**First joined:**", Formatting.FormatTime(user.firstConnect, DATE_FORMAT), true)
                        .addField("**Last joined:**", Formatting.FormatTime(user.lastConnect, DATE_FORMAT), true)
                        .addBlankField()
                        .addField("**Total playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.total.days,
                            h: user.playtime.total.hours,
                            m: user.playtime.total.minutes,
                            s: user.playtime.total.seconds
                        }), true)
                        .addField("**Monthly playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.monthly.days,
                            h: user.playtime.monthly.hours,
                            m: user.playtime.monthly.minutes,
                            s: user.playtime.monthly.seconds
                        }), true)
                        .addField("**Weekly playtime:**", Formatting.Format("%dd %hh %mm %ss", {
                            d: user.playtime.weekly.days,
                            h: user.playtime.weekly.hours,
                            m: user.playtime.weekly.minutes,
                            s: user.playtime.weekly.seconds
                        }), true)
                        .setColor("ORANGE")
                        .setFooter("All times are " + Formatting.FormatTime(user.firstConnect, "%Z") + " | 💀 SANS, By MasterR3C0RD");
                    if(extra)
                        embed.addField("**Snacks:**", user.codes.map(code => this.codes[code]).join(", ") || "None");
                    
                    await message.reply(embed);
                    await message.delete();
                } catch(e){
                    logger.Error(e.stack);
                    await message.reply("Failed to lookup `" + id + "`");
                }
            },
            description: "Looks up more information about a user. Only usable by people with lookup privileges.",
            arguments: {
                "user": "The user to check information for. Can be a FiveM identifier, their SANS UID, or a Discord mention"
            },
            usage: [
                "%c <@227551426232975361>",
                "Gets MasterR3C0RD's information."
            ]
        }
    };

    public async Load() {
        const config = await ModuleCall("System", "GetConfig"); 
        await config.Defaults(defaults);
        const data = await config.GetValues(defaults);
        this.lookupRoles = (data["IdentityLookupRoles"] as string).split(" ");
        this.lookupExtRoles = (data["IdentityLookupExtRoles"] as string).split(" ");
        this.database = await MySQL.createConnection(await ModuleCall("System", "GetMysqlInfo", data["IdentityDatabase"] as string));
        this.database.on("error", err => {
            logger.Error(err.stack);
            logger.Info("Will attempt to reconnect to database in 5 seconds.");
            setTimeout(() => {
                ModuleCall("System", "GetMysqlInfo", data["IdentityDatabase"] as string)
                    .then(data => MySQL.createConnection(data))
                    .then(conn => this.database = conn);
            }, 5000);
        });
        logger.Info("Connected to identities database");
        await ModuleCall("DiscordConnection", "RegisterCommands", this.commands);
        logger.Info("Registered commands");
    }

    public async Unload() {
        await ModuleCall("DiscordConnection", "UnregisterCommands", Object.keys(this.commands));
    }
}