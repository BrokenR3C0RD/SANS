import "../../Module";

declare type name = "System";
declare module "../../Module" {
    /**
     * Loads a module and adds it to the startup load list.
     * @param moduleName The `System` module
     * @param functionName `LoadModule`
     * @param name The name of the module to load.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "LoadModule", name: string): Promise<boolean>;

    /**
     * Unloads a module and removes it from the startup load list.
     * @param moduleName The `System` module
     * @param functionName `UnloadModule`
     * @param name The name of the module to unload.
     */
    // @ts-ignore
    function ModuleCall(moduleName: name, functionName: "UnloadModule", name: string): Promise<boolean>;
}