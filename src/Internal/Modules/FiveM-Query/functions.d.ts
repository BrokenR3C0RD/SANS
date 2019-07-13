import "../../Module";
import { Dictionary } from "../../Module";

type name = "FiveM-Query";

/** Holds information about a server. */
interface QueryInfo {
    /** Some internal FiveM thing */
    enhancedHostSupport: boolean,
    /** The name of the server. */
    hostname: string,
    /** The icon of the server, a base64-encoded PNG */
    icon: string,
    /** A list of all resources loaded on the server. */
    resources: string[],
    /** The server version string. */
    server: string,
    /** Variables set by the server. */
    vars: {
        /** The maximum number of clients on the server at one time. */
        sv_maxClients: number,
        [i: string]: string | number
    },
    /** The version of the server. */
    version: number
}

/** Information about a player on a server. */
interface QueryPlayer {
    /** The IP of the player. */
    endpoint: string,
    /** The ID of the user on the server. */
    id: number,
    /** A list of the user's identifiers. */
    identifiers: string[],
    /** The user's name on the server. */
    name: string,
    /** The user's ping in milliseconds. */
    ping: number
}

/** Information about a server from the global server list API. */
interface QueryAPI {
    /** Information about the server. */
    Data: {
        /** The current number of users on the server. */
        clients: number,
        /** The name of the gamemode. */
        gamename: string,
        /** The type of the gamemode. */
        gametype: string,
        /** The name of the map in use. */
        mapname: string,
        /** A list of the players on the server. */
        players: QueryPlayer[],
        /** The protocol version of the server. */
        protocol: number,
        /** The number of upvotes the server has. */
        upvotePower: number,
        /** Alias for vars.sv_maxClients */
        svMaxclients: number,
        /** Alias for vars.sv_maxClients */
        sv_maxclients: number,
        /** The last time the server pinged the API. */
        lastSeen: Date
    } & QueryInfo,
    /** The IP of the server. */
    EndPoint: string
}

/** Information about a server. */
interface QueryData {
    /** Information about the server. */
    info: QueryInfo,
    /** A list of players on the server. */
    players: QueryPlayer[]
}

declare module "../../Module" {

    /**
     * Gets information about a server.
     * @param moduleName The `FiveM-Query` module
     * @param functionName `GetServerInfo`
     * @param ip The IP or alias of the server to get information for.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetServerInfo", ip: string): Promise<QueryData>;

    /**
     * Gets information about servers from the FiveM server list API.
     * @param moduleName The `FiveM-Query` module
     * @param functionName `GetAPIInfo`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetAPIInfo"): Promise<QueryAPI[]>;

    /**
     * Returns whether or not the server is trusted.
     * @param moduleName The `FiveM-Query` module
     * @param functionName `IsAllowedServer`
     * @param ip The IP or alias of the server to test.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "IsAllowedServer", ip: string): Promise<boolean>;

    /**
     * Returns a dictionary of all trusted servers and their IPs.
     * @param moduleName The `FiveM-Query` module
     * @param functionName `AllowedServers`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "AllowedServers"): Promise<Dictionary<string>>;
}