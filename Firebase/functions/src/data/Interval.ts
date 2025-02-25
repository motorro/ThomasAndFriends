import {LocalDateTime, ZoneId} from "@js-joda/core";
require("@js-joda/timezone");

export class Interval {
    readonly start: LocalDateTime;
    readonly end: LocalDateTime;
    readonly zone: ZoneId;

    get isValid(): boolean {
        return this.start.isBefore(this.end) || this.start.isEqual(this.end);
    }

    private constructor(start: LocalDateTime, end: LocalDateTime, tz: ZoneId) {
        this.start = start;
        this.end = end;
        this.zone = tz;
    }

    static fromLocal(start: LocalDateTime, end: LocalDateTime, tz: ZoneId): Interval {
        return new Interval(start, end, tz);
    }

    plusMinutes(minutes: number): Interval {
        return new Interval(this.start.plusMinutes(minutes), this.end.plusMinutes(minutes), this.zone);
    }

    minusMinutes(minutes: number): Interval {
        return new Interval(this.start.minusMinutes(minutes), this.end.minusMinutes(minutes), this.zone);
    }

    withZoneSameInstant(tz: ZoneId): Interval {
        return new Interval(
            this.start.atZone(this.zone).withZoneSameInstant(tz).toLocalDateTime(),
            this.end.atZone(this.zone).withZoneSameInstant(tz).toLocalDateTime(),
            tz
        );
    }

    equals(other: Interval): boolean {
        return this.start.equals(other.start) && this.end.equals(other.end) && this.zone.equals(other.zone);
    }

    toString(): string {
        return `Interval: ${this.start.toString()} - ${this.end.toString()}, TZ(${this.zone.toString()})`;
    }
}
