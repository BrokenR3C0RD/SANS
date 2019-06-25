import "../../Module";
import { Dictionary } from "../../Module";

type name = "FiveM-Query";

declare module "../../Module" {

    /**
     * Returns a copy to the Discord Client object.
     * @param moduleName The `DiscordConnection` module
     * @param functionName `GetClient`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetClient"): Promise<Discord.Client>;
}