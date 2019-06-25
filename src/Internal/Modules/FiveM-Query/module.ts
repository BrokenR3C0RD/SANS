/*
    San Andreas State Bot
    FiveM query library module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus, CommandDescriptor } from "../../Module";
import request from "request-promise";

const logger = global.logger;
const defaults = {
    FiveMServers: "Public: servers.sastrp.com:30120, Whitelist: servers.sastrp.com:30125, Training: servers.sastrp.com:30135, Development: servers.sastrp.com:30140, Economy: servers.sastrp.com:30180, EconomyDevelopment: servers.sastrp.com:30185"
};

const FiveMServerList = "https://servers-live.fivem.net/api/servers/";

interface QueryInfo {
    enhancedHostSupport: boolean,
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
    public Version = new Version(1, 0, 0);
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
        }
    }

    private sqlConfig: Config | null = null;
    private servers: Dictionary<string> = {};

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);

        const servers = (config["FiveMServers"] as string).split(", ").map(server => server.split(": "));
        servers.forEach(server => this.servers[server[0]] = server[1]);
    }

    public async Unload() {

    }
}