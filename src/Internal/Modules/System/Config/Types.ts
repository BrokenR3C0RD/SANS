/*
    San Andreas State Bot
    System module - configuration types
    (c) 2019 MasterR3C0RD
*/

export type ConfigValue = string | number;

export interface ConfigData {
    [k: string]: ConfigValue | null
}
/**
 * A configuration driver interface
 */
export interface ConfigurationDriver {
    /**
     * Set defaults for this configuration.
     * @param data Default data for the configuration.
     * @param reset Whether or not to completely reset the config before writing the defaults.
     */
    Defaults(data: ConfigData, reset?: boolean): Promise<boolean>;

    /**
     * Get a list of all keys in this config.
     */
    Keys(): Promise<string[]>;

    /**
     * Get a single value from the configuration, with an optional default.
     * @param key The name in the configuration.
     * @param defaultValue A default value in case there is no value in the config.
     */
    GetValue(key: string, defaultValue?: ConfigValue): Promise<ConfigValue | null>;

    /**
     * Get multiple values from the configuration, with defaults available.
     * @param data An object with names and defaults from the config.
     */
    GetValues(data: ConfigData): Promise<ConfigData>;

    /**
     * Set a single value in the config.
     * @param key The name to set in the config.
     * @param value The value to set in the config.
     */
    SetValue(key: string, value: ConfigValue): Promise<boolean>;

    /**
     * Set multiple values in the config.
     * @param data An object with names and values to put into the config.
     */
    SetValues(data: ConfigData): Promise<boolean[]>;

    /**
     * Delete a value from the config.
     * @param key The name to delete from the config.
     */
    DeleteValue(key: string): Promise<boolean>;
    
    /**
     * Delete multiple values from the config.
     * @param keys An array of names to delete from the config.
     */
    DeleteValues(keys: string[]): Promise<boolean[]>;

    /**
     * Returns a Promise that triggers when the configuration is ready for use.
     */
    Ready(): Promise<void>;
}