import { ModuleLoader, Logger } from "./Internal/Module";

declare global {
    module NodeJS {
        interface Global {
            loader: ModuleLoader,
            logger: Logger
        }
    }
}