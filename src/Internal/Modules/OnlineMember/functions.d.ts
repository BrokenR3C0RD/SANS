import "../../Module";
import { Dictionary } from "../../Module";

type name = "OnlineMember";

declare module "../../Module" {

    /**
     * Returns a copy to the Discord Client object.
     * @param moduleName The `OnlineMember` module
     * @param functionName `GetClient`
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "GetClient"): Promise<Discord.Client>;
}