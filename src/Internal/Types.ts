/*
    San Andreas State Bot
    (c) 2019 MasterR3C0RD
*/

/** A Dictionary is a typed Object. */
export type Dictionary<T2> = {
    [i: string]: T2
};

/**
 * Provides functions for formatting data.
 */
export namespace Formatting {
    /**
 * A dictionary of values that is formatted using a format string.
 */
    export type FormatData = {
        [i: string]: any
    }

    /**
     * Array containing month names.
     * @readonly
     */
    export const MonthNames = [
        "January",
        "Febuary",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    /**
     * Array containing names of days of the week.
     * @readonly
     */
    export const WeekdayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    /**
     * Short name of the current timezone.
     * @readonly
     */
    export const TimeZoneName = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];

    /**
     * The default format string used for {@link Formatting.FormatDate}
     */
    export let DefaultDateFormat: string = "%4y/%2m/%2d";
    /**
     * The default format string used for {@link Formatting.FormatTime}
     */
    export let DefaultTimestampFormat: string = "%4Y/%2m/%2d %2H:%2M:%2S %Z";

    const FORMATVAR_LOOKUP = /\%(\-?[0-9]+)?([a-zA-Z])/g;
    /**
     * Formats a string with given formatting data.
     * 
     * @param format The format string.
     * Format strings follow the format `%a`, where `a` is any letter, or `%pa`,
     * where `p` is a number telling whether to use `p` characters at the end (positive)
     * or to use `p` characters from the beginning (negative). Numbers will be padded with `0`, and
     * everything else will be padded with a space.
     * 
     * @param variables An object containing the data to replace in the format string,
     * where the keys are alphabetical characters (case sensitive) inserted into the format string.
     */
    export function Format(format: string, variables: FormatData): string {
        return format.replace(FORMATVAR_LOOKUP, (match, pad, name) => {
            if (name in variables) {
                let value = variables[name];
                let padLength: number = +pad;
                if (typeof value == "number") {
                    if (!isNaN(padLength)) {
                        if (padLength > 0)
                            return ("0".repeat(padLength) + value.toString()).substr(-padLength);
                        else
                            return (value.toString() + "0".repeat(-padLength)).substr(0, -padLength);
                    } else {
                        return value.toString();
                    }
                } else {
                    if (pad) {
                        if (padLength > 0)
                            return (" ".repeat(padLength) + value.toString()).substr(-padLength);
                        else
                            return (value.toString() + " ".repeat(-padLength)).substr(0, -padLength);
                    } else {
                        return value.toString();
                    }
                }
            } else {
                return match;
            }
        });
    }

    /**
     * Formats a Date object as a date string.
     * 
     * @param date The Date object to format. Defaults to the current date.
     * @param format The format string. Available formatting characters:\
     * \
     * `%Y`: the last 2 characters of the year (ex, `19`)\
     * `%y`: the full year (ex, `2019`)\
     * `%M`: the name of the month (ex, `January`)\
     * `%m`: the number corresponding to the current month of the year (ex, `1`)\
     * `%D`: the name of the current day of the week (ex, `Wednesday`)\
     * `%d`: the current day of the month (ex, `2`)\
     * \
     * You can also pad numbers (ex, `%2m` outputs `01`) or get the
     * beginning of strings (ex, `%-3D` outputs `Wed`).
     */
    export function FormatDate(date: Date = new Date(), format: string = DefaultDateFormat): string {
        return Format(format, {
            Y: date.getFullYear() % 100,
            y: date.getFullYear(),
            M: MonthNames[date.getMonth()],
            m: date.getMonth() + 1,
            D: WeekdayNames[date.getDay()],
            d: date.getDate()
        });
    }

    /**
     * Formats a Date object as a timestamp string,
     * using formatting replacements similar to the Unix `date` tool.
     * 
     * @param date The Date object to format. Defaults to the current date. 
     * @param format The format string. Available formatting characters:\
     * \
     * `%A`: the name of the current day of the week (ex, `Wednesday`)\
     * `%a`: AM or PM, depending on whether the current time is before or after noon (ex, `AM`)\
     * `%B`: the name of the current month (ex, `January`)\
     * `%D`: the current date, formatted as `mm/dd/yy` (ex, `01/02/19`)\
     * `%d`: the current day of the month (ex, `2`)\
     * `%F`: the current date, formatted as `yyyy-mm-dd` (ex, `2019-01-02`)\
     * `%H`: the current hour in 24-hour time (ex, `0`)\
     * `%I`: the current hour in 12-hour time (ex, `12`)\
     * `%M`: the current minute (ex, `30`)\
     * `%m`: the number corresponding to the current month of the year (ex, `1`)\
     * `%N`: the current millisecond (ex, `0`)\
     * `%S`: the current second (ex, `4`)\
     * `%T`: the current time, formatted as `hh:mm:ss` (ex, `00:30:04`)\
     * `%u`: the number corresponding to the current day of the week (ex, `4`)\
     * `%Y`: the full year (ex, `2019`)\
     * `%Z`: the abbreviation of the current timezone (ex, `UTC`)\
     * \
     * You can also pad numbers (ex, `%2H` outputs `00`) or get the
     * beginning of strings (ex, `%-3A` outputs `Wed`).
     */
    export function FormatTime(date: Date = new Date(), format: string = DefaultTimestampFormat): string {
        return Format(format, {
            A: WeekdayNames[date.getDay()],
            a: date.getHours() < 12 ? "AM" : "PM",
            B: MonthNames[date.getMonth()],
            D: FormatDate(date, "%2m/%2d/%2y"),
            d: date.getDate(),
            F: FormatDate(date, "%4y-%2m-%2d"),
            H: date.getHours() + 1,
            I: (date.getHours() + 1) % 12 || 12,
            M: date.getMinutes(),
            m: date.getMonth() + 1,
            N: date.getMilliseconds(),
            S: date.getSeconds(),
            T: Format("%2h:%2m:%2s", {
                h: date.getHours() + 1,
                m: date.getMinutes(),
                s: date.getSeconds()
            }),
            u: date.getDay() + 1,
            Y: date.getFullYear(),
            Z: TimeZoneName
        });
    }
}

/** Stores semantic versioning information. */
export class Version {
    private major: number = 0;
    private minor: number = 0;
    private patch: number = 0;
    private prerelease: string = "";
    private buildtag: string = "";

    /**
     * Creates a semantic versioning object.
     * @param major The major version.
     * @param minor The minor version.
     * @param patch The patch version.
     * @param prerelease The prerelease tag, if any.
     * @param buildtag The build tag, if any.
     */
    public constructor(major: number, minor: number, patch: number, prerelease: string = "", buildtag: string = "") {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.prerelease = prerelease;
        this.buildtag = buildtag;
    }

    /**
     * The major version.
     */
    public get Major(): number {
        return this.major;
    }

    /**
     * The minor version.
     */
    public get Minor(): number {
        return this.minor;
    }

    /**
     * The patch version.
     */
    public get Patch(): number {
        return this.patch;
    }

    /**
     * The prerelease tag, if any.
     */
    public get PreRelease(): string {
        return this.prerelease
    }

    /**
     * The build tag, if any.
     */
    public get BuildTag(): string {
        return this.buildtag;
    }

    /**
     * Returns the version as a string in the format `MAJOR.MINOR.PATCH-PRERELEASE+BUILDTAG`.
     */
    public toString(): string {
        return Formatting.Format("%M.%m.%p%P%B", {
            M: this.major,
            m: this.minor,
            p: this.patch,
            P: this.prerelease ? "-" + this.prerelease : "",
            B: this.buildtag ? "+" + this.buildtag : ""
        });
    }

    /**
     * Returns `true` if the version provided is semantically compatible with this version.
     * @param dependency A version to compare with.
     */
    public IsCompatible(dependency: Version): boolean {
        return (dependency.major == this.major ||
                dependency.minor <= this.minor ||
                dependency.patch <= this.patch);
    }
}

/** An interface for an object Factory */
export interface IFactory<T> {
    create(...args: any[]): Promise<T>
}

/** Can be destroyed safely. */
export interface IDisposable {
    /**
     * Whether or not an object is destroyed.
     */
    readonly destroyed: boolean;
    /**
     * Destroys the object, cleaning it up afterwards.
     */
    destroy(): Promise<any>
}