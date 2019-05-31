/*
    San Andreas State Bot
    System module
    (c) 2019 MasterR3C0RD
*/

import { Module, Logger, Version, parentPath } from "../../Module";

import path from "path";
import { ConfigurationDriver } from "./Config/Types";
import IniConfig from "./Config/Ini";
import MysqlConfig from "./Config/Mysql";

export = class SystemModule extends Module {
    public Name = "System Module";
    public Author = "MasterR3C0RD";
    public Version = global.loader.APIVersion;
    public Dependencies = {};

    private iniConfig: IniConfig;
    private sqlConfig: MysqlConfig | null = null;

    public constructor(){
        super(new Logger("SystemModule", undefined, "system.log"));
        this.iniConfig = new IniConfig(path.join(parentPath, "system.ini"));
    }

    public async Load() {
        this.logger.Debug("Loading INI configuration...")
        await this.iniConfig.Ready();

        
    }

    public async Unload() {

    }
}