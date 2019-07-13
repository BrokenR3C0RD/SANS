/*
    SANS INI configuration driver
    (c) 2019 MasterR3C0RD
*/

import fs from "fs";
import ini from "ini";
import { ConfigurationDriver, ConfigData, ConfigValue } from './Types';
import { resolve } from "bluebird";

type StringDataObject = {
    [i: string]: string | StringDataObject
}

export =
    /**
     * A configuration driver storing data in a .ini file.
     */
    class IniConfiguration implements ConfigurationDriver {
        private filename: string = "";
        private data: StringDataObject = {};
        private ready: boolean = false;

        /**
         * Creates an INI configuration using the provided file name.
         * @param filename The name to use for the INI file.
         */
        public constructor(filename: string) {
            this.filename = filename;
        }

        private finishready: (() => void)[] = [];

        public Ready(): Promise<void> {
            return new Promise((resolve, reject) => {
                if (this.ready)
                    return

                fs.readFile(this.filename, "utf8", (err, data) => {
                    if (err) {
                        if (err.code === "ENOENT") {
                            this.data = {};
                            this.ready = true;
                        } else {
                            reject(err);
                        }
                    } else {
                        try {
                            this.data = ini.parse(data);
                            this.ready = true;
                        } catch (e) {
                            reject(e);
                        }
                        this.ready = true;
                    }
                    return resolve();
                });
            });
        }

        private SaveConfig(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                fs.writeFile(this.filename, ini.encode(this.data), err => {
                    if (err) {
                        return resolve(false);
                    }

                    return resolve(true);
                })
            });
        }

        public Defaults(data: ConfigData, reset: boolean = false): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (reset)
                    this.data = {};

                for (let key in data) {
                    let keyParts = key.split(".");
                    let base: StringDataObject = this.data;
                    for (let i = 0; i < keyParts.length - 1; i++) {
                        if (typeof base[keyParts[i]] !== "object")
                            base[keyParts[i]] = {};

                        base = base[keyParts[i]] as StringDataObject;
                    }
                    if (base[keyParts[keyParts.length - 1]] == null)
                        base[keyParts[keyParts.length - 1]] = (data[key] + "");
                }

                this
                    .SaveConfig()
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            });
        }

        public Keys(): Promise<string[]> {
            return new Promise((resolve, reject) => {
                let keys: string[] = [];

                let base: StringDataObject = this.data;
                (function loop(object: StringDataObject, baseKey: string) {
                    for (let key in object) {
                        keys.push(baseKey.length == 0 ? key : baseKey + key);
                        if (typeof object[key] == "object")
                            loop(object[key] as StringDataObject, baseKey.length == 0 ? key : baseKey + key);
                    }
                })(base, "");

                return resolve(keys);
            });
        };

        public GetValue(key: string, defaultValue?: any): Promise<ConfigValue | null> {
            return new Promise((resolve, reject) => {
                let base: StringDataObject = this.data;
                let keyParts = key.split(".");
                for (let i = 0; i < keyParts.length - 1; i++) {
                    if (typeof base[keyParts[i]] !== "object")
                        base[keyParts[i]] = {};

                    base = base[keyParts[i]] as StringDataObject;
                }
                let value = base[keyParts[keyParts.length - 1]] || defaultValue || null;
                if (typeof value == "object")
                    value = defaultValue || null;

                return resolve(value as ConfigValue | null);
            });
        }

        public GetValues(data: ConfigData): Promise<ConfigData> {
            return new Promise((resolve, reject) => {
                let out: ConfigData = {};

                for (let key in data) {
                    let keyParts = key.split(".");
                    let base: StringDataObject = this.data;
                    for (let i = 0; i < keyParts.length - 1; i++) {
                        if (typeof base[keyParts[i]] !== "object")
                            base[keyParts[i]] = {};

                        base = base[keyParts[i]] as StringDataObject;
                    }
                    let value = base[keyParts[keyParts.length - 1]] || data[key] || null;
                    if (typeof value == "object")
                        value = data[key] || null;

                    out[key] = value;
                }
                return resolve(out);
            });
        }

        public SetValue(key: string, value: ConfigValue): Promise<boolean> {
            return new Promise((resolve, reject) => {
                let base: StringDataObject = this.data;
                let keyParts = key.split(".");
                for (let i = 0; i < keyParts.length - 1; i++) {
                    if (typeof base[keyParts[i]] !== "object")
                        base[keyParts[i]] = {};

                    base = base[keyParts[i]] as StringDataObject;
                }
                if (typeof base[keyParts[keyParts.length - 1]] == "object")
                    return resolve(false);

                base[keyParts[keyParts.length - 1]] = (value + "");
                this
                    .SaveConfig()
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            });
        }

        public SetValues(data: ConfigData): Promise<boolean[]> {
            return new Promise((resolve, reject) => {
                let out: boolean[] = [];
                for (let key in data) {
                    let keyParts = key.split(".");
                    let base: StringDataObject = this.data;
                    for (let i = 0; i < keyParts.length - 1; i++) {
                        if (typeof base[keyParts[i]] !== "object")
                            base[keyParts[i]] = {};

                        base = base[keyParts[i]] as StringDataObject;
                    }
                    if (typeof base[keyParts[keyParts.length - 1]] == "object") {
                        out.push(false);
                    } else {
                        base[keyParts[keyParts.length - 1]] = (data[key] + "");
                        out.push(true);
                    }
                }
                this
                    .SaveConfig()
                    .then(() => resolve(out))
                    .catch(err => reject(err));
            });
        };

        public DeleteValue(key: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                let base: StringDataObject = this.data;
                let keyParts = key.split(".");
                for (let i = 0; i < keyParts.length - 1; i++) {
                    if (typeof base[keyParts[i]] !== "object")
                        base[keyParts[i]] = {};

                    base = base[keyParts[i]] as StringDataObject;
                }

                delete base[keyParts[keyParts.length - 1]];
                this
                    .SaveConfig()
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            });
        };

        public DeleteValues(keys: string[]): Promise<boolean[]> {
            return new Promise((resolve, reject) => {
                let out: boolean[] = [];
                for (let key of keys) {
                    let keyParts = key.split(".");
                    let base: StringDataObject = this.data;
                    for (let i = 0; i < keyParts.length - 1; i++) {
                        if (typeof base[keyParts[i]] !== "object")
                            base[keyParts[i]] = {};

                        base = base[keyParts[i]] as StringDataObject;
                    }
                    delete base[keyParts[keyParts.length - 1]];
                    out.push(true);
                }
                this
                    .SaveConfig()
                    .then(() => resolve(out))
                    .catch(err => reject(err));
            });
        };
    }