import "../../Module";
import { Dictionary } from "../../Module";

type name = "FiveM-Identities";

/** Describes a name used by a user. */
interface UserName {
    /** The name as a string */
    name: string,
    /** The last time the server joined a server with this name. */
    lastUsed: Date
}

/** Describes a user's playtime. */
interface UserPlayTime {
    /** The number of days played. */
    days: number,
    /** The number of hours played. */
    hours: number,
    /** The number of minutes played. */
    minutes: number,
    /** The number of seconds played. */
    seconds: number
}

/** Describes membership to a department. */
type DepartmentPair = [
    /** The ID of the department.  */
    number,
    /** The ID of the role. */
    number
]

/** Stores information about a user. */
interface UserInfo {
    /** The user's ID. */
    uid: number,
    /** Usernames that the user has used previously. */
    names: UserName[],
    /** Total, monthly, and weekly playtimes for this user. */
    playtime: {
        /** The total playtime this user has accumulated. */
        total: UserPlayTime,
        /** The playtime this user has accumulated since the 23rd of the past month. */
        monthly: UserPlayTime,
        /** The playtime this user has accumulated since the Tuesday of the past week. */
        weekly: UserPlayTime
    },
    /** The first time the user connected to the server. */
    firstConnect: Date,
    /** The last time the user connected to the server. */
    lastConnect: Date,
    /** Every identifier this user has been seen with. */
    identifiers: string[],
    /** Staff codes for this user. */
    codes: number[],
    /** The department this user is enrolled in */
    department: DepartmentPair
}

declare module "../../Module" {
    /**
     * Returns a copy to the Discord Client object.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `GetClient`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetClient"): Promise<Discord.Client>;

}