/*
    San Andreas State Bot
    System module
    (c) 2019 MasterR3C0RD
*/

import { Module, Version, parentPath, Formatting, LoadedModules } from "../../Module";

import path from "path";
import IniConfig from "./Config/Ini";
import MysqlConfig from "./Config/Mysql";

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
                let sql = <MysqlConfig> this.sqlConfig;
                logger.Info("Loading module " + name);
                await global.loader.LoadModule(name);
                this.modules.push(name);
                await sql.SetValue("Modules", this.modules.join(" "));

                let module = <Module> LoadedModules[name][0];
                logger.Info(Formatting.Format("Loaded %n v%v", {
                    n: module.Name,
                    v: module.Version.toString()
                }));

                return true;
            } catch(e){
                global.logger.Error("Error loading module: " + e.stack);
                return false;
            }
        },
        UnloadModule: async (name: string): Promise<boolean> => {
            try {
                let sql = <MysqlConfig> this.sqlConfig;
                logger.Info("Unloading module " + name);
                await global.loader.UnloadModule(name);
                if(this.modules.indexOf(name) !== -1)
                    this.modules.splice(this.modules.indexOf(name), 1);

                await sql.SetValue("Modules", this.modules.join(" "));

                let module = <Module> LoadedModules[name][0];
                logger.Info("Unloaded module " + name);

                return true;
            } catch(e){
                global.logger.Error("Error loading module: " + e.stack);
                return false;
            }
        }
    };

    private iniConfig: IniConfig;
    private sqlConfig: MysqlConfig | null = null;
    private modules: string[] = [];

    public constructor(){
        super();
        if(!global.loader.APIVersion.IsCompatible(this.Version)){
            throw new Error("System module is incompatible with the current API version.");
        }
        this.iniConfig = new IniConfig(path.join(parentPath, "system.ini"));
    }

    public async Load() {
        logger.Debug("Loading INI configuration...", this.Name);
        await this.iniConfig.Ready();
        await this.iniConfig.Defaults(INI_DEFAULTS);
        let bootcfg = await this.iniConfig.GetValues(INI_DEFAULTS);

        logger.Debug("Connecting to MySQL server...");
        let sql = this.sqlConfig = new MysqlConfig({
            username: <string> bootcfg["MySQL.Username"],
            password: <string> bootcfg["MySQL.Password"],
            host:     <string> bootcfg["MySQL.Host"],
            port:    +<string> bootcfg["MySQL.Port"],
            database: <string> bootcfg["MySQL.Database"],
            table:    <string> bootcfg["MySQL.Table"]
        });
        await sql.Ready();
        await sql.Defaults(MYSQL_DEFAULTS);
        logger.Debug("Loading MySQL configuration...");
        let dbcfg = await sql.GetValues(MYSQL_DEFAULTS);
        
        logger.Info("Loading modules...");
        let modules = this.modules = (<string> dbcfg["Modules"]).split(" ");
        await Promise.all(modules.map(name => async () => {
            await global.loader.LoadModule(name)
            let module = <Module> LoadedModules[name][0];
            logger.Info(Formatting.Format("Loaded %n v%v", {
                n: module.Name,
                v: module.Version.toString()
            }));
        }));
        logger.Info("All modules loaded.");
    }

    public async Unload() {

    }
}