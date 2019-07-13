/*
    SANS logging library
    (c) 2019 MasterR3C0RD
*/

import fs from "fs";
import colors from "colors";
import { Formatting, IDisposable } from "./Types";

/**
 * Possible log levels for a {@link LogMessage}.
 */
export enum LogLevel {
    Trace,
    Debug,
    Warning,
    Error,
    Info
}

/**
 * Represents a message to be printed in a {@link Logger} instance.
 */
export class LogMessage {
    /**
     * The log level.
     * @readonly
     */
    public level: LogLevel = LogLevel.Info;

    /**
     * The message represented by this object.
     * @readonly
     */
    public message: string = "";

    /**
     * The timestamp this message was created.
     * @readonly
    */
    public timestamp: Date = new Date();

    /**
     * The source of the logger.
     */
    public name: string;

    /**
     * Creates a {@link LogMessage} with a given message and optionally a {@link LogLevel}.
     * @param message The message to be represented by the resulting object.
     * @param level The required verbosity of the logger for the message to get printed.
     */
    public constructor(message: string, level: LogLevel = LogLevel.Info, name: string = "System"){
        this.message = message;
        this.level = level
        this.name = name;
    }

    /**
     * Returns a string representation of the log message with color formatting.
     */
    public ToString(): string {
        let start = Formatting.Format("[%t] %n%l: ", {
            n: (this.name ? " ".repeat(20 - this.name.substr(0, 20).length) + "(" + colors.gray(this.name.substr(0, 20)) + ") ": " ".repeat(20)),
            t: colors.yellow(Formatting.FormatTime(this.timestamp, "%D %T")),
            l: colors.red(LogLevel[this.level])
        });

        return start + this.message.replace(/\n/g, "\n" + " ".repeat(colors.stripColors(start).length))
    }

    /**
     * Returns a string representation of the log message with no color formatting.
     */
    public ToSafeString(): string {
        let start = Formatting.Format("[%t] %n%l: ", {
            n: (this.name ?  " ".repeat(20 - this.name.substr(0, 20).length) + "(" + this.name.substr(0, 20) + ") ": " ".repeat(20)),
            t: Formatting.FormatTime(this.timestamp, "%D %T"),
            l: LogLevel[this.level]
        });

        return start + this.message.replace(/\n/g, "\n" + " ".repeat(start.length))
    }
}

/**
 * A simple logger that allows redirection to a file.
 */
export class Logger implements IDisposable {
    static LogLevel = LogLevel;

    private stream: fs.WriteStream | null = null;
    private minConsoleLevel: LogLevel = LogLevel.Error;
    private minFileLevel: LogLevel = LogLevel.Trace;
    private defaultSource: string = "";

    private _destroyed: boolean = false;
    public get destroyed(): boolean {
        return this._destroyed;
    }

    /**
     * Creates a logger with the specified properties.
     * @param minConsoleLevel The highest verbosity messages can have until they aren't printed to the console. Default is Error level.
     * @param filename The name of the file to log to.
     * @param minFileLevel The highest verbosity messages can have until they aren't written to the log file. Default is Trace level.
     */
    public constructor(defaultSource: string = "", minConsoleLevel: LogLevel = LogLevel.Error, filename?: string, minFileLevel: LogLevel = LogLevel.Trace){
        this.defaultSource = defaultSource;
        this.minConsoleLevel = minConsoleLevel;
        if(filename){
            try {
                this.stream = fs.createWriteStream(filename, {
                    flags: "a",
                    encoding: "utf8"
                });
                this.minFileLevel = minFileLevel;
            } catch(e){
                this.stream = null;
                console.error(e.stack);
            }
        }
    }

    /**
     * Writes a LogMessage to the console and/or the file, depending on the verbosity of the message.
     * @param message The message to write.
     */
    public Log(message: LogMessage): void {
        if(message.level >= this.minConsoleLevel)
            process.stderr.write((process.stdout.isTTY ? message.ToString() : message.ToSafeString()) + "\n");

        if(this.stream && message.level >= this.minFileLevel)
            this.stream.write(message.ToSafeString() + "\n");
    }

    /**
     * Writes a message with Info verbosity.
     * @param message The content of the message.
     * @param source The source module of the message.
     */
    public Info(message: string, source?: string): void {
        return this.Log(new LogMessage(message, LogLevel.Info, source || this.defaultSource || undefined));
    }

    /**
     * Writes a message with Error verbosity.
     * @param message The content of the message.
     * @param source The source module of the message.
     */
    public Error(message: string, source?: string): void {
        return this.Log(new LogMessage(message, LogLevel.Error, source || this.defaultSource || undefined));
    }

    /**
     * Writes a message with Warning verbosity.
     * @param message The content of the message.
     * @param source The source module of the message.
     */
    public Warn(message: string, source?: string): void {
        return this.Log(new LogMessage(message, LogLevel.Warning, source || this.defaultSource || undefined));
    }

    /**
     * Writes a message with Trace verbosity.
     * @param message The content of the message.
     * @param source The source module of the message.
     */
    public Trace(message: string, source?: string): void {
        return this.Log(new LogMessage(message, LogLevel.Trace, source || this.defaultSource || undefined));
    }

    /**
     * Writes a message with Debug verbosity.
     * @param message The content of the message.
     * @param source The source module of the message.
     */
    public Debug(message: string, source?: string): void {
        return this.Log(new LogMessage(message, LogLevel.Debug, source || this.defaultSource || undefined));
    }

    /**
     * Destroys the logger, closing the file stream in the process.
     */
    public async destroy() {
        let err = new Error("Logger destroyed");
        err.name = "";
        this.Trace(<string> err.stack);
        
        if(this.stream)
            this.stream.close();
    }
}