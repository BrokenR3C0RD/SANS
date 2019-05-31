/*
    SANS MySQL configuration driver
    (c) 2019 MasterR3C0RD
*/

import MySQL from "mysql2/promise";
import { ConfigurationDriver, ConfigData, ConfigValue } from './Types';

/**
 * Information used to connect to a MySQL database.
 */
type ConnectionInfo = {
    /**
     * The username to use to connect to the MySQL database.
     */
    username: string,
    /**
     * The password to use to connect to the MySQL database.
     */
    password: string,
    /**
     * The hostname of the database to connect to.
     */
    host: string,
    /**
     * The port the database server is running on.
     */
    port?: number,
    /**
     * The name of the database to store configuration data in.
     */
    database: string,
    /**
     * The name of the table to store configuration data in.
     */
    table: string
};



export =
/**
 * A configuration driver storing data in a MySQL database.
 */
class MysqlConfiguration implements ConfigurationDriver {
    private connection: MySQL.Pool;
    private table: string;
    private ready: boolean = false;

    public constructor(options: ConnectionInfo){
        this.connection =
        MySQL
            .createPool({
                user: options.username,
                password: options.password,
                host: options.host,
                port: options.port,
                database: options.database
            });
        this.table = options.table;
    }

    public async Ready(): Promise<void> {
        if(this.ready)
            return;
        
        let result = await this.connection.query("CREATE TABLE IF NOT EXISTS `" + this.table + "` (name VARCHAR(256) PRIMARY KEY, value TEXT);" );
        this.ready = true;
    }


    public Defaults(data: ConfigData, reset?: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let setDefault = () => {
                let list: Promise<any>[] = [];
                for(let key in data){
                    list.push(this.connection.execute("INSERT IGNORE INTO `" + this.table + "` (name, value) VALUES (?, ?) ", [key, data[key]]));
                }
                Promise
                    .all(list)
                    .then(values => {
                        resolve(true);
                    })
                    .catch(err => {
                        if(err)
                            reject(err);
                        else
                            resolve(false);
                    });
            }
            if(reset){
                this
                    .connection
                    .execute("TRUNCATE `" + this.table + "`")
                    .then(() => {
                        return setDefault();
                    })
                    .catch(err => {
                        if(err)
                            reject(err);
                        else
                            resolve(false);
                    });
            } else {
                return setDefault();
            }
        });
    }

    public Keys(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this
                .connection
                .execute("SELECT name FROM `" + this.table + "`")
                .then(rows => {
                    let keys: string[] = rows.map(row => (row as MySQL.RowDataPacket).key);
                    return resolve(keys);
                })
                .catch(err => reject(err));
        });
    }

    public GetValue(key: string, defaultValue?: ConfigValue | null): Promise<ConfigValue | null> {
        return new Promise((resolve, reject) => {
            this
                .connection
                .execute("SELECT value FROM `" + this.table + "` WHERE name = ?", [key])
                .then(rows => {
                    console.log(rows);
                    let row = rows[0] as MySQL.RowDataPacket;
                    console.log(row);
                    return resolve(row.value || row.value === 0 ? 0 : (defaultValue || null));
                })
                .catch(err => reject(err));
        });
    }

    public GetValues(data: ConfigData): Promise<ConfigData> {
        return new Promise((resolve, reject) => {
            let keys = Object.keys(data);
            let promises: Promise<ConfigValue | null>[] = [];
            for(let i = 0; i < keys.length; i++){
                promises.push(this.GetValue(keys[i], data[keys[i]]));
            }
            Promise
                .all(promises)
                .then(values => {
                    let output: ConfigData = {};
                    for(let i = 0; i < keys.length; i++){
                        output[keys[i]] = values[i];
                    }
                    return resolve(output);
                })
                .catch(err => reject(err));
        });
    }

    public SetValue(key: string, value: ConfigValue): Promise<boolean>{
        return new Promise((resolve, reject) => {
            this
                .connection
                .execute("INSERT INTO `" + this.table + "` (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?", [
                    key,
                    value,
                    value
                ])
                .then(results => resolve(true))
                .catch(err => resolve(false));
        });
    };

    public SetValues(data: ConfigData): Promise<boolean[]> {
        return new Promise((resolve, reject) => {
            let promises: Promise<boolean>[] = [];
            for(let key in data){
                promises.push(this.SetValue(key, data[key] as ConfigValue));
            }
            Promise
                .all(promises)
                .then(results => resolve(results))
                .catch(err => reject(err));
        });
    }

    public DeleteValue(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this
                .connection
                .execute("DELETE FROM `" + this.table + "` WHERE name = ?", [key])
                .then(results => resolve(true))
                .catch(err => resolve(false));
        });
    }

    public DeleteValues(keys: string[]): Promise<boolean[]> {
        return new Promise((resolve, reject) => {
            let promises: Promise<boolean>[] = [];
            for(let i = 0; i < keys.length; i++){
                promises.push(this.DeleteValue(keys[i]));
            }
            Promise
                .all(promises)
                .then(results => resolve(results))
                .catch(err => reject(err));
        });
    }
};