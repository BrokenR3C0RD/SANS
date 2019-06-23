/*
    San Andreas State Bot
    FiveM Identities Library module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus } from "../../Module";
import MySQL from "mysql2/promise";

const logger = global.logger;
const defaults = {
    "IdentityDatabase": "police"
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

export = class FiveMIdentities extends Module {
    public Name = "FiveM Identities Library";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);

    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0)
    };

    public Functions = {
        GetUser: async (id: string): Promise<UserInfo> => {
            const database = <MySQL.Connection>this.database;

            let rows = <MySQL.RowDataPacket[]>(await database.query("SELECT users.uid AS uid, users.first_connect AS first_connect, users.last_connect AS last_connect, usernames.name AS name, usernames.last_used AS last_used FROM usernames LEFT JOIN users ON users.uid = usernames.uid WHERE usernames.uid = "
                + (isNaN(parseInt(id)) ? "(SELECT uid FROM userids WHERE id = ?)" : "?"), [
                    id
                ]))[0];

            let uid: number = rows[0].uid;
            let first: Date = rows[0].first_connect;
            let last: Date = rows[0].last_connect;
            let names: UserName[] = rows.map(row => {
                return {
                    name: row.name,
                    lastUsed: row.last_used
                };
            }).sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf());

            let identifiers = (<MySQL.RowDataPacket[][]>await database.query("SELECT id FROM userids WHERE uid = ?", [
                uid
            ]))[0].map(row => row.id);

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

            let codes = (<MySQL.RowDataPacket[][]> await database.query("SELECT cd FROM usercodes WHERE uid = ?", [uid]))[0].map(row => row.cd);

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
                codes: codes
            }
        },
        SetCode: async (user: UserInfo, code: number): Promise<void> => {
            const database = <MySQL.Connection>this.database;
            await database.query(
                user.codes.indexOf(code) !== -1
                ? "DELETE FROM usercodes WHERE uid = ? AND cd = ?"
                : "INSERT INTO usercodes (uid, cd) VALUES (?, ?)",
                [user.uid, code]);
            
            if(user.codes.indexOf(code) == -1)
                user.codes.push(code);
            else
                user.codes.splice(user.codes.indexOf(code), 1);
        },
        SetDept: async (user: UserInfo, deptid: number, rankid: number) => {

        }
    }

    private database: MySQL.Connection | null = null;

    public async Load() {
        const config = await ModuleCall("System", "GetConfig");
        await config.Defaults(defaults);
        const data = await config.GetValues(defaults);
        this.database = await MySQL.createConnection(await ModuleCall("System", "GetMysqlInfo", data["IdentityDatabase"]));
        this.database.on("error", err => {
            logger.Error(err.stack);
            setTimeout(() => {
                MySQL
                    .createConnection(await ModuleCall("System", "GetMysqlInfo", data["IdentityDatabase"]))
                    .then(conn => this.database = conn);
            }, 5000);
        });
        logger.Info("Connected to identities database");

        console.log(await this.Functions.GetUser("2"));
    }

    public async Unload() {

    }
}