import "../../Module";

declare type name = "DiscordConnection";
declare module "../../Module" {
    /**
     * Does something magical
     * @param moduleName The name of the module providing the function.
     * @param functionName The name of the function to call.
     * @param args An
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "something", ...args: any[]): Promise<any>;
}