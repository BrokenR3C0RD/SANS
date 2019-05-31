/*
    San Andreas State Bot
    (c) 2019 MasterR3C0RD
*/
declare global {
    module NodeJS {
        interface Global {
            loader: ModuleLoader
        }
    }
}

import { ModuleLoader, Logger } from "./Internal/Module";

let logger = new Logger("Runner", undefined, "runner.log");
let loader = global.loader = new ModuleLoader("Internal/Modules");
logger.Info("Starting SASRP Bot, version " + loader.APIVersion.toString());

async function main(){
    
}

main()
    .catch(async err => {
        logger.Error(err.stack);
        await logger.destroy();
        process.exit(1);
    });