import "../../Module";
import MysqlConfig from "./Config/Mysql";
import MySQL from "mysql2";

declare type name = "System";
declare module "../../Module" {
    export type Config = MysqlConfig;
    /**
     * Loads a module and adds it to the startup load list.
     * @param moduleName The `System` module
     * @param functionName `LoadModule`
     * @param name The name of the module to load.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "LoadModule", name: string): Promise<boolean>;

    /**
     * Unloads a module and removes it from the startup load list.
     * @param moduleName The `System` module
     * @param functionName `UnloadModule`
     * @param name The name of the module to unload.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "UnloadModule", name: string): Promise<boolean>;

    /**
     * Returns the configuration object used for storing system configuration.
     * @param moduleName The `System` module
     * @param functionName `GetConfig`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetConfig"): Promise<MysqlConfig>;

    /**
     * Starts all modules.
     * @param moduleName The `System` module
     * @param functionName `StartModules`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "StartModules"): Promise<void>;
    //GetMysqlInfo

    /**
     * Returns a MySQL connection object.
     * @param moduleName The `System` module
     * @param functionName `GetMysqlInfo`
     * @param database The name of the database to use
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetMysqlInfo", database: string): Promise<MySQL.ConnectionOptions>;
}