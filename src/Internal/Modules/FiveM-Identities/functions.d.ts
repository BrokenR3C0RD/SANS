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
     * Looks up a user and returns their information.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `GetUser`
     * @param id The identifier to look up by.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetUser", id: string): Promise<UserInfo | null>;

    /**
     * Toggles a user's staff code.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `SetCode`
     * @param user The user to modify.
     * @param code The code to set.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "SetCode", user: UserInfo, code: number): Promise<void>;

    /**
     * Sets a user's police department and rank.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `SetDept`
     * @param user The user to modify.
     * @param deptid The department identifier.
     * @param rankid The rank identifier.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "SetDept", user: UserInfo, deptid: number, rankid: number): Promise<void>;


    /**
     * Gets all of a user's permissions.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `GetPerms`
     * @param user The user to get permissions for, or `null` to get the permissions that apply to all users.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetPerms", user: UserInfo | null): Promise<Dictionary<boolean>>;

    /**
     * Sets a user's permission.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `SetPerm`
     * @param user The user to modify, or `null` if the permission should apply to all users.
     * @param perm The name of the permission to set.
     * @param allow True if the permission should be allowed, false if the permission should be denied
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "SetPerm", user: UserInfo | null, perm: string, allow?: boolean): Promise<void>;

    /**
     * Sets a user's permission to join whitelisted servers..
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `SetWhitelist`
     * @param user The user to modify.
     * @param allow True if the permission should be allowed, false if the permission should be denied
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "SetWhitelist", user: UserInfo, allow?: boolean): Promise<void>;

    /**
     * Deletes a user's permission.
     * @param moduleName The `FiveM-Identities` module
     * @param functionName `DeletePerm`
     * @param user The user to modify, or `null` if the permission should apply to all users.
     * @param perm The name of the permission to delete.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "DeletePerm", user: UserInfo | null, perm: string): Promise<void>;
}