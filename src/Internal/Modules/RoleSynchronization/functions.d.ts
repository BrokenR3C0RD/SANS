import "../../Module";
import { Dictionary } from "../../Module";

type name = "RoleSynchronization";

declare module "../../Module" {

    /**
     * This module does not export any functions.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: string): never;
}