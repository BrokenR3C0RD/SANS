/*
    San Andreas State Bot
    FiveM query library module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus, CommandDescriptor } from "../../Module";
import request from "request-promise";
import Discord from "discord.js";

const logger = global.logger;
const defaults = {
    FiveMServers: "Public: 54.39.29.90:30120, Whitelist: 54.39.29.90:30125, Training: 54.39.29.90:30135, Development: 54.39.29.90:30140, Economy: 54.39.29.90:30180, EconomyDevelopment: 54.39.29.90:30185",
    FiveMServerCounts: "Public: 548584333011714068, Whitelist: 548584242905481216, Economy: 559259612331769856"
}

const FiveMServerList = "https://servers-live.fivem.net/api/servers/";

interface QueryInfo {
    enhancedHostSupport: boolean,
    hostname: string,
    icon: string,
    resources: string[],
    server: string,
    vars: {
        sv_maxClients: number,
        [i: string]: string | number
    },
    version: number
}

interface QueryPlayer {
    endpoint: string,
    id: number,
    identifiers: string[],
    name: string,
    ping: number
}

interface QueryAPI {
    Data: {
        clients: number,
        gamename: string,
        gametype: string,
        mapname: string,
        players: QueryPlayer[],
        protocol: number,
        upvotePower: number,
        svMaxclients: number,
        sv_maxclients: number,
        lastSeen: Date,
        EndPoint: string
    } & QueryInfo
}

interface QueryData {
    info: QueryInfo,
    players: QueryPlayer[]
}

export = class FiveMQueryModule extends Module {
    public Name = "FiveM Query Library";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 1, 0);
    public Dependencies = {
        "DiscordConnection": new Version(1, 0, 0)
    };
    public Functions = {
        GetServerInfo: async (ip: string): Promise<QueryData> => {
            let base = "http://" + (ip in this.servers ? this.servers[ip] : ip);
            let info = <QueryInfo> await request.get({
                baseUrl: base,
                url: "/info.json",
                json: true
            });
            let players = <QueryPlayer[]> await request.get({
                baseUrl: base,
                url: "/players.json",
                json: true
            });

            return { info: info, players: players };
        },
        GetAPIInfo: async (): Promise<QueryAPI[]> => {
            return <QueryAPI[]> await request.get({
                url: FiveMServerList,
                json: true
            });
        },
        IsAllowedServer: async (ip: string): Promise<boolean> => {
            return Object.values(this.servers).indexOf(ip) != -1;
        },
        AllowedServers: async (): Promise<Dictionary<string>> => {
            return this.servers;
        }
    }

    private sqlConfig: Config | null = null;
    private servers: Dictionary<string> = {};
    private serverCounts: Dictionary<string> = {};
    private updateTimeout: NodeJS.Timeout | null = null;

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);

        const servers = (config["FiveMServers"] as string).split(", ").map(server => server.split(": "));
        servers.forEach(server => this.servers[server[0]] = server[1]);
        const servercounts = (config["FiveMServerCounts"] as string).split(", ").map(server => server.split(": "));
        servercounts.forEach(server => this.serverCounts[server[0]] = server[1]);

        let client = await ModuleCall("DiscordConnection", "GetClient");

        this.updateTimeout = setInterval(async () => {
            for(let key in this.serverCounts){
                let channel = <Discord.VoiceChannel> client.channels.get(this.serverCounts[key]);
                try {
                    let info = await this.Functions.GetServerInfo.call(this, key);
                    await channel.setName(`${key}: ${info.players.length}/${info.info.vars.sv_maxClients} players`);
                } catch(e){
                    logger.Error(`Failed to get information for server ${key} : ${e.message}`);
                    await channel.setName(`${key}: down`);
                }
            }
        }, 30000);
    }

    public async Unload() {
        clearInterval(this.updateTimeout as NodeJS.Timeout);
    }
}