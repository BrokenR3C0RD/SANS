/*
    San Andreas State Bot
    (c) 2019 MasterR3C0RD
*/

import path from "path";
import { IFactory, IDisposable, Version, Dictionary, Formatting } from "./Types";
import { Logger } from "./Logger";

export { Logger, Version, Dictionary, Formatting };

let meta: string = require("./build.json")["build-meta"];
let parent: NodeModule = module;
while(parent.parent != null)
    parent = parent.parent;

/** The parent directory of the bot. */
export let parentPath = path.dirname(parent.filename);
console.log(parentPath);

/**
 * The current module API version provided.
 */
const APIVersion = new Version(1, 0, 0, "alpha", meta);

/**
 * Defines modules and the version required for use.
 */
export type Dependencies = Dictionary<Version>;

type ModuleConstructor = new () => Module;

/**
 * A Dictionary of async functions.
 */
export type FunctionDictionary = Dictionary<(this: Module, ...args: any[]) => Promise<any>>;

/**
 * Load status of a Module.
 */
export enum ModuleStatus {
    /**
     * The module is currently being loaded.
     */
    Loading,
    /**
     * The module has successfully been loaded.
     */
    Loaded,
    /**
     * The module was loaded, but has been unloaded.
     */
    Unloaded,
    /**
     * The module failed to load.
     */
    Failure
};

/**
 * A module used to add functionality to the bot.
 */
export abstract class Module implements IDisposable {
    /** The official name of this module. */
    abstract Name: string;
    /** The author of this module. */
    abstract Author: string;
    /** The version of this module. */
    abstract Version: Version;
    /** A list of dependencies required by this module. */
    abstract Dependencies: Dependencies;
    /** An instance of a logger for this module. */
    protected logger: Logger;

    /** Functions that can be called by other libraries. */
    public readonly Functions: FunctionDictionary = {};

    private _destroyed: boolean = false;
    public get destroyed(): boolean {
        return this._destroyed;
    }

    /**
     * Pass a Logger to be used for debugging purposes.
     */
    public constructor(logger: Logger){
        this.logger = logger;
    }

    /**
     * Called when loading the module.
     */
    abstract Load(): Promise<void>;

    /**
     * Called when unloading the module.
     */
    abstract async Unload(): Promise<void>;

    /** Destroys the module, preparing it for unload. Don't override this. */
    public async destroy() {
        this.logger.Debug("Module destroyed.");
        await this.logger.destroy();
        this._destroyed = true;
    }
}

/**
 * All modules and their status.
 */
export var LoadedModules: Dictionary<[Module, ModuleStatus.Loaded] | [null, ModuleStatus.Failure | ModuleStatus.Loading | ModuleStatus.Unloaded]> = {};

/**
 * Calls a function provided by another module.
 * @param moduleName The name of the module providing the function.
 * @param functionName The name of the function to call.
 * @param args The arguments for the function, if needed.
 */
export async function ModuleCall(moduleName: string, functionName: string, ...args: any[]): Promise<any> {
    if(moduleName in LoadedModules && LoadedModules[moduleName][1] == ModuleStatus.Loaded){
        let mod = <Module> LoadedModules[moduleName][0];

        if(functionName in mod.Functions){
            return await mod.Functions[functionName].apply(mod, args);
        } else {
            throw new Error(`Attempted to call ${functionName} from ${moduleName} but ${moduleName} does not provide said function.`);
        }
    } else {
        throw new Error(`Attempted to call ${functionName} from ${moduleName} but module is not loaded.`);
    }
}

/**
 * A factory for Modules.
 */
export class ModuleLoader implements IFactory<Module> {
    private base: string = "";
    /**
     * Creates a ModuleLoader that reads modules from `base`
     * @param base The base location to load modules from.
     */
    public constructor(base: string){
        this.base = base;
    }

    /**
     * The current module API version provided.
     */
    public get APIVersion(): Version {
        return APIVersion;
    }

    /**
     * Resolves all dependencies passed.
     * @param deps All module names and the required version.
     */
    protected async resolveDependencies(deps: Dependencies): Promise<void>{
        for(let [name, version] of Object.entries(deps)){
            if(name in LoadedModules && LoadedModules[name][1] == ModuleStatus.Loaded){
                if(!version.IsCompatible((<Module> LoadedModules[name][0]).Version)){
                    throw new Error(`Dependency load failure: expected ${name} >= version ${version.toString()}, got version ${(<Module>LoadedModules[name][0]).Version.toString()}.`);
                }
            } else {
                try {
                    await this.LoadModule(name);
                    if(LoadedModules[name][1] !== ModuleStatus.Loaded){
                        throw new Error(`Unknown module load error.`);
                    }
                }
                catch(e){
                    e.message += `Dependency load failure: expected ${name} >= version ${version.toString()}, got failed module load.\nOriginal error: ${e.message}`;
                    throw e;
                }

                if(!version.IsCompatible((<Module>LoadedModules[name][0]).Version)){
                    throw new Error(`Dependency load failure: expected ${name} >= version ${version.toString()}, got version ${(<Module>LoadedModules[name][0]).Version.toString()}.`);
                }
            }
        }
    }

    /**
     * Loads and instantiates a Module.
     * @param name The name of the module to load.
     */
    public async create(name: string): Promise<Module> {
        if(LoadedModules[name][1] != ModuleStatus.Loaded){
            throw new Error("Module is already loaded");
        }

        let p = path.resolve(this.base, name, "module");

        delete require.cache[p];
        let mod = new (<ModuleConstructor> (require(p)))();
        if(!(mod instanceof Module)){
            throw new TypeError(`${name} is not a valid module`);
        }

        return mod;
    }

    /**
     * Loads a module and its dependencies.
     * @param name The name of the module to load.
     */
    public async LoadModule(name: string): Promise<void> {
        LoadedModules[name] = [null, ModuleStatus.Loading];
        try {
            let mod = await this.create(name);
            await this.resolveDependencies(mod.Dependencies);
            await mod.Load();
            
            LoadedModules[name] = [mod, ModuleStatus.Loaded]
        } catch(e){
            LoadedModules[name] = [null, ModuleStatus.Failure];
            throw e;
        }
    }

    /**
     * Gets a list of all modules dependent on this module.
     * @param name The name of the module to get 
     * @returns The names of every module dependant on this one.
     */
    public async GetAllDependents(name: string): Promise<string[]> {
        let output: string[] = [];
        for(let mod in LoadedModules){
            if(LoadedModules[mod][1] == ModuleStatus.Loaded){
                if(name in (<Module> LoadedModules[mod][0]).Dependencies){
                    output.push(name);
                }
            }
        }
        return output;
    }

    /**
     * Unloads a module and its dependents.
     * @param name The name of the module to unload.
     * @returns The names of all modules unloaded, including the original one passed.
     */
    public async UnloadModule(name: string): Promise<string[]> {
        if(!(name in LoadedModules) || LoadedModules[name][1] !== ModuleStatus.Loaded){
            return [];
        }
        let dependents = await this.GetAllDependents(name);
        for(let dep of dependents){
            await this.UnloadModule(dep);
        }

        await (<Module> LoadedModules[name][0]).Unload();
        await (<Module> LoadedModules[name][0]).destroy();

        LoadedModules[name] = [null, ModuleStatus.Unloaded];
        return [name].concat(dependents);
    }
}