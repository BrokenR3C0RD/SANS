/*
    San Andreas State Bot
    System module
    (c) 2019 MasterR3C0RD
*/

import { Module, Version, parentPath, Formatting, LoadedModules } from "../../Module";

import path from "path";
import IniConfig from "./Config/Ini";
import MysqlConfig from "./Config/Mysql";
import mysql from "mysqL2";

const logger = global.logger;
const INI_DEFAULTS = {
    "MySQL.Host":     "localhost",
    "MySQL.Port":     "3306",
    "MySQL.Username": "sans",
    "MySQL.Password": "password123",
    "MySQL.Database": "sans",
    "MySQL.Table":    "sans-config"
};

const MYSQL_DEFAULTS = {
    "Modules": ""
};

export = class SystemModule extends Module {
    public Name = "System Module";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0, "alpha");
    public Dependencies = {};
    public Functions = {
        LoadModule: async (name: string): Promise<boolean> =>  {
            try {
                if(name == "System")
                    return false;

                let sql = <MysqlConfig> this.sqlConfig;
                logger.Info("Loading module " + name, "System");
                await global.loader.LoadModule(name);
                this.modules.push(name);
                await sql.SetValue("Modules", this.modules.join(" "));

                let module = <Module> LoadedModules[name][0];
                logger.Info(Formatting.Format("Loaded %n v%v", {
                    n: module.Name,
                    v: module.Version.toString()
                }), "System");

                return true;
            } catch(e){
                global.logger.Error("Error loading module: " + e.stack, "System");
                return false;
            }
        },
        UnloadModule: async (name: string): Promise<boolean> => {
            try {
                if(name == "System")
                    return false;
                
                let sql = <MysqlConfig> this.sqlConfig;
                logger.Info("Unloading module " + name, "System");
                await global.loader.UnloadModule(name);
                if(this.modules.indexOf(name) !== -1)
                    this.modules.splice(this.modules.indexOf(name), 1);

                await sql.SetValue("Modules", this.modules.join(" "));

                let module = <Module> LoadedModules[name][0];
                logger.Info("Unloaded module " + name, "System");
                return true;
            } catch(e){
                global.logger.Error("Error loading module: " + e.stack, "System");
                return false;
            }
        },
        GetConfig: async (): Promise<MysqlConfig> => {
            return <MysqlConfig> this.sqlConfig;
        },
        GetMysqlInfo: async (database: string): Promise<mysql.ConnectionOptions> => {
            const config = await (this.iniConfig as IniConfig).GetValues(INI_DEFAULTS);
            return {
                host:     <string> config["MySQL.Host"],
                port:   +(<string> config["MySQL.Port"]),
                user:     <string> config["MySQL.Username"],
                password: <string> config["MySQL.Password"],
                database:          database
            }
        },
        
        // Originally, this was going to be part of Load(), but since System wouldn't be finished loading yet, no functions provided
        // by it would be usable (this woud cause an error like `Error: Attempted to call GetConfig from System but module is not loaded.`)
        // As such, Runner now has to run this function through ModuleCall (which isn't that big of a deal, just goes to show that it's
        // a very powerful asset even inside internal code)
        StartModules: async(): Promise<void> => {
            logger.Debug("Loading MySQL configuration...", "System");
            const dbcfg = await (<MysqlConfig> this.sqlConfig).GetValues(MYSQL_DEFAULTS);
            
            logger.Info("Loading modules...", "System");
            const modules = this.modules = (<string> dbcfg["Modules"]).split(" ");
    
            await Promise.all(modules.map(async (name) => {
                    await global.loader.LoadModule(name)
                    const module = <Module> LoadedModules[name][0];
                    logger.Info(Formatting.Format("Loaded %n v%v", {
                        n: module.Name,
                        v: module.Version.toString()
                    }), "System");
            }));
            logger.Info("All modules loaded.", "System");
        }
    };

    private iniConfig: IniConfig | null = null;
    private sqlConfig: MysqlConfig | null = null;
    private modules: string[] = [];

    public constructor(){
        super();
        if(!global.loader.APIVersion.IsCompatible(this.Version)){
            throw new Error("System module is incompatible with the current API version.");
        }
    }

    public async Load() {
        const ini = this.iniConfig = new IniConfig(path.join(parentPath, "system.ini"));
        logger.Debug("Loading INI configuration...", "System");
        await ini.Ready();
        await ini.Defaults(INI_DEFAULTS, false);
        const bootcfg = await ini.GetValues(INI_DEFAULTS);

        logger.Debug("Connecting to MySQL server...", "System");
        const sql = this.sqlConfig = new MysqlConfig({
            username: <string> bootcfg["MySQL.Username"],
            password: <string> bootcfg["MySQL.Password"],
            host:     <string> bootcfg["MySQL.Host"],
            port:    +<string> bootcfg["MySQL.Port"],
            database: <string> bootcfg["MySQL.Database"],
            table:    <string> bootcfg["MySQL.Table"]
        });
        await sql.Ready();
        await sql.Defaults(MYSQL_DEFAULTS);
    }

    public async Unload() {

    }
}