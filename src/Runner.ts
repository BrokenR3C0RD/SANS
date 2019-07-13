/*
    San Andreas State Bot
    (c) 2019 MasterR3C0RD
*/

import 'source-map-support/register'

declare global {
    module NodeJS {
        interface Global {
            loader: ModuleLoader,
            logger: Logger
        }
    }
}

import path from "path";
import { ModuleCall, ModuleLoader, Logger } from "./Internal/Module";

let logger = global.logger = new Logger("Runner", undefined, "system.log", Logger.LogLevel.Trace);
let loader = global.loader = new ModuleLoader(path.join(__dirname, "Internal/Modules"));
logger.Info("Starting SASRP Bot, version " + loader.APIVersion.toString());

async function main(){
    await loader.LoadModule("System");
    await ModuleCall("System", "StartModules");
}

main()
    .catch(async err => {
        logger.Error(err.stack);
        await logger.destroy();
        process.exit(1);
    });