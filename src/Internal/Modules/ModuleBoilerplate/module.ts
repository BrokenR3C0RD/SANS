/*
    San Andreas State Bot
    Boilerplate module
    (c) 2019 MasterR3C0RD
*/
import { Module, Version, parentPath, Formatting, LoadedModules, ModuleCall, Config, Dictionary, ModuleStatus } from "../../Module";

const logger = global.logger;
const defaults = {
    
};

export = class BoilerplateModule extends Module {
    public Name = "ModuleBoilerPlate";
    public Author = "MasterR3C0RD";
    public Version = new Version(1, 0, 0);
    public Dependencies = {};
    public Functions = {}

    private sqlConfig: Config | null = null;

    public async Load() {
        const sql = this.sqlConfig = await ModuleCall("System", "GetConfig");
        await sql.Defaults(defaults);
        const config = await sql.GetValues(defaults);
    }

    public async Unload() {

    }
}