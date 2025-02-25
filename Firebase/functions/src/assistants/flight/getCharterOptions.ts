import {getMa, MetropolitanArea, MetropolitanAreaSchema} from "./getMa";
import {Plane, PlaneSchema} from "./getBaseFlightOptions";
import {LocalDate, LocalTime, ZoneId} from "@js-joda/core";
import {BeResponse} from "../../data/BeResponse";
import {CharterModel} from "./data/CharterModel";
import {AirportOpeningHours2} from "./data/AirportOpeningHours2";
import {Interval} from "../../data/Interval";
import {logger} from "@motorro/firebase-ai-chat-core";
import {SuggestAirportData} from "./data/SuggestAirportData";
import {CharterDateWrapper} from "./data/CharterDateWrapper";
import {CharterItinerary} from "./data/CharterItinerary";
import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";
import {Airport, AirportSchema, Waypoint} from "../../data/Waypoint";
import {callBe} from "../../callBe";
import {parseLocalDate, parseLocalDateTime} from "../../utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@js-joda/timezone");

export interface TimeInterval {
    readonly fromLocalTime: string
    readonly toLocalTime: string
}

export const TimeIntervalSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Describes a date-time interval",
    properties: {
        fromLocalTime: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Minimum local date time. When selecting a time the value from user should be equal or greater then this value"
        },
        toLocalTime: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Maximum local date time. When selecting a time the value from user should be equal or less then this value"
        }
    }
};

export interface Schedule {
    departure: TimeInterval
    arrival: TimeInterval
}

export const ScheduleSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Flight departure time option",
    properties: {
        departure: <FunctionDeclarationSchema>{
            ...TimeIntervalSchema,
            description: "When user needs to select departure time, he needs to choose values within this interval"
        },
        toLocalTime: <FunctionDeclarationSchema>{
            ...TimeIntervalSchema,
            description: "Arrival times corresponding to 'departure'. If the client prefers to select arrival time, he needs to choose values within this interval"
        }
    }
};

export interface RouteFrom {
    readonly to: Airport
    readonly flightTimeMinutes: number
    readonly scheduleOptions: ReadonlyArray<Schedule>
}

export const RouteFromSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Describes possible route from the departure airport",
    properties: {
        to: <FunctionDeclarationSchema>{
            ...AirportSchema,
            description: "Arrival airport"
        },
        flightTimeMinutes: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Flight time in minutes from departure to arrival"
        },
        scheduleOptions: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            description: "A list of available departure and arrival time intervals",
            items: ScheduleSchema
        }
    }
};

export interface Route {
    readonly from: Airport
    readonly destinations: ReadonlyArray<RouteFrom>
}

export const RouteSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Describes route options from the departure airport",
    properties: {
        from: <FunctionDeclarationSchema>{
            ...AirportSchema,
            description: "Departure airport"
        },
        destinations: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            description: "A list of available destinations",
            items: RouteFromSchema
        }
    }
};

export interface CharterOptions {
    readonly fromMa: MetropolitanArea
    readonly toMa: MetropolitanArea
    readonly departureDate: string
    readonly plane: Plane
    readonly flightId: number,
    readonly possibleRoutes: ReadonlyArray<Route>
    readonly maximumPassengers: number
}

export const CharterOptionsSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Describes the charter information and options to configure",
    properties: {
        fromMa: <FunctionDeclarationSchema>{
            ...MetropolitanAreaSchema,
            description: "Departure metropolitan area: a city, a location, a place"
        },
        toMa: <FunctionDeclarationSchema>{
            ...MetropolitanAreaSchema,
            description: "Arrival metropolitan area:  a city, a location, a place"
        },
        departureDate: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            format: "date",
            description: "Departure date local to 'fromMa'"
        },
        plane: <FunctionDeclarationSchema>{
            ...PlaneSchema,
            description: "A plane model selected by user"
        },
        flightId: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Flight ID to pass to order options"
        },
        possibleRoutes: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            description: "Contains the options to configure departure airport, arrival airport and the departure time",
            items: RouteSchema
        },
        maximumPassengers: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Maximum number of passengers the aircraft can take"
        }
    }
};

interface GetCharterRequest {
    readonly planeIds: ReadonlyArray<number>,
    readonly areas: ReadonlyArray<
        {
            from: number,
            to: number
        }
    >
    readonly selectedDates: ReadonlyArray<string>
}

interface GetCharterModelResponse extends BeResponse {
    readonly charter?: CharterModel
}

interface GetAirportsDataRes extends BeResponse {
    readonly ap: ReadonlyArray<SuggestAirportData>
}

const charterEndpoint = "/getCharterInfo";
const airportEndpoint = "/www/getData";

export async function getCharterOptions(from: Waypoint, to: Waypoint, departureDate: string, plane: Plane): Promise<CharterOptions> {
    const fromMa = await getMa(from);
    const toMa = await getMa(to);
    const request: GetCharterRequest = {
        planeIds: [plane.id],
        areas: [{from: fromMa.id, to: toMa.id}],
        selectedDates: [departureDate]
    };
    const result = await callBe<GetCharterModelResponse>(
        charterEndpoint,
        request
    );

    const charter = result.charter;
    if (undefined === charter) {
        return Promise.reject(new Error("Didn't get any charter data"));
    }
    const itinerary = charter.segmentOptions[0];
    if (undefined === itinerary) {
        return Promise.reject(new Error("Charter didn't return any itinerary"));
    }

    const airportsResult = await callBe<GetAirportsDataRes>(
        airportEndpoint,
        {
            data: itinerary.airports.from.map((it) => it.code).concat(itinerary.airports.to.map((it) => it.code))
        }
    );
    const airportMap = new Map(airportsResult.ap.map((it) => [it.code, it]));
    const routes: Array<Route> = [];
    itinerary.airports.from.forEach((from) => {
        const route = buildRoute(
            from.code,
            parseLocalDate(departureDate),
            itinerary,
            airportMap
        );
        if (undefined !== route) {
            routes.push(route);
        }
    });

    return {
        fromMa: fromMa,
        toMa: toMa,
        departureDate: departureDate.toString(),
        plane: plane,
        flightId: charter.id,
        possibleRoutes: routes,
        maximumPassengers: itinerary.pax.maxPax
    };
}

export function buildRoute(fromCode: string, departureDate: LocalDate, data: CharterItinerary, airports: ReadonlyMap<string, SuggestAirportData>): Route | undefined {
    const fromAirportData = airports.get(fromCode);
    const fromAirport = data.airports.from.find((it) => fromCode === it.code);
    if (undefined === fromAirportData || undefined === fromAirport) {
        throw new Error(`Airport ${fromCode} was not found in airport data`);
    }
    const destinations: Array<RouteFrom> = [];
    for (const to of data.airports.to) {
        const toData = airports.get(to.code);
        if (undefined === toData) {
            logger.w("No airport data for:", to.code);
            continue;
        }
        const eft = data.airports.flightTimes[`${fromCode}-${to.code}`];
        if (undefined == eft) {
            logger.w(`No EFT for ${fromCode}-${to.code}`);
            continue;
        }
        const eftMinutes = Math.round(eft * 60.0);
        const departureTz = ZoneId.of(fromAirportData.timezone || ZoneId.UTC.toString());
        const arrivalTz = ZoneId.of(toData.timezone || ZoneId.UTC.toString());
        let departures = calculateAirportsDeparture(
            departureDate,
            fromAirport.hours2,
            to.hours2,
            eftMinutes,
            departureTz,
            arrivalTz
        );
        departures = coerceIntervals(departures, data.dateWrapper);
        if (0 === departures.length) {
            logger.d(`No routes for ${fromCode}-${to.code}`);
            continue;
        }
        destinations.push({
            to: createAirport(toData),
            flightTimeMinutes: eftMinutes,
            scheduleOptions: departures.map((it) => intervalToSchedule(it, eftMinutes, arrivalTz))
        });
    }

    if (0 === destinations.length) {
        return undefined;
    }

    return {
        from: createAirport(fromAirportData),
        destinations: destinations
    };

    function createAirport(data: SuggestAirportData): Airport {
        return {
            id: data.code,
            value: `${data.name} (${data.city})`,
            location: {
                latitude: data.lat,
                longitude: data.lon
            },
            types: ["airport"]
        };
    }

    function intervalToSchedule(interval: Interval, eft: number, arrivalTz: ZoneId): Schedule {
        const arrival = interval.plusMinutes(eft).withZoneSameInstant(arrivalTz);
        return {
            departure: {
                fromLocalTime: interval.start.toString(),
                toLocalTime: interval.end.toString()
            },
            arrival: {
                fromLocalTime: arrival.start.toString(),
                toLocalTime: arrival.end.toString()
            }
        };
    }
}

export function hoursToInterval(airportWorkingHours: AirportOpeningHours2, tz: ZoneId): Interval {
    return Interval.fromLocal(parseLocalDateTime(airportWorkingHours.open), parseLocalDateTime(airportWorkingHours.close), tz);
}

const minTime = LocalTime.of(0, 0);
const maxTime = LocalTime.of(23, 59);

function is24(hours: Interval): boolean {
    const start = hours.start.toLocalTime();
    const end = hours.end.toLocalTime();
    return (start.isBefore(minTime) || start.equals(minTime)) && (end.isAfter(maxTime) || end.equals(maxTime));
}

export function calculateAirportsDeparture(
    departureDate: LocalDate,
    departureHours: ReadonlyArray<AirportOpeningHours2>,
    arrivalHours: ReadonlyArray<AirportOpeningHours2>,
    eft: number,
    departureZone: ZoneId,
    arrivalZone: ZoneId
): ReadonlyArray<Interval> {
    if (arrivalHours.some((it) => is24(hoursToInterval(it, arrivalZone)))) {
        return departureHours.map((it) => hoursToInterval(it, departureZone));
    }

    const result: Array<Interval> = [];
    departureHours.forEach((dh) => {
        const dhi = hoursToInterval(dh, departureZone);
        if (dhi.start.toLocalDate().equals(departureDate) && dhi.end.toLocalDate().equals(departureDate)) {
            arrivalHours.forEach((ah) => {
                calculateAirportDeparture(dhi, hoursToInterval(ah, arrivalZone), eft).forEach((it) => {
                    result.push(it);
                });
            });
        }
    });

    result.sort((a, b) => a.start.isBefore(b.start) ? -1 : (a.start.equals(b.start) ? 0 : 1));

    return result;
}

export function calculateAirportDeparture(
    departureInterval: Interval,
    arrivalInterval: Interval,
    eft: number
): ReadonlyArray<Interval> {
    if (is24(arrivalInterval)) {
        return [departureInterval];
    }
    const expectedInterval = departureInterval.plusMinutes(eft).withZoneSameInstant(arrivalInterval.zone);

    const openAtArrival = expectedInterval.start;
    const closeAtArrival = expectedInterval.end;
    const maxOpen = (openAtArrival.isAfter(arrivalInterval.start) ? openAtArrival : arrivalInterval.start);
    const minClose = (closeAtArrival.isBefore(arrivalInterval.end) ? closeAtArrival : arrivalInterval.end);

    const result: Array<Interval> = [];

    if (openAtArrival.toLocalDate().equals(closeAtArrival.toLocalDate())) {
        const closedBeforeOpened = closeAtArrival.isBefore(arrivalInterval.start) || closeAtArrival.isEqual(arrivalInterval.start);
        const openedAfterClosed = openAtArrival.isAfter(arrivalInterval.end) || openAtArrival.isEqual(arrivalInterval.end);

        if (!(closedBeforeOpened || openedAfterClosed)) {
            const interval = Interval.fromLocal(maxOpen, minClose, arrivalInterval.zone);
            result.push(interval.minusMinutes(eft).withZoneSameInstant(departureInterval.zone));
        }
    } else {
        const i1 = Interval.fromLocal(maxOpen, minClose, arrivalInterval.zone)
            .minusMinutes(eft)
            .withZoneSameInstant(departureInterval.zone);
        const i2 = Interval.fromLocal(closeAtArrival.toLocalDate().atTime(arrivalInterval.start.toLocalTime()), minClose, arrivalInterval.zone)
            .minusMinutes(eft)
            .withZoneSameInstant(departureInterval.zone);

        if (i1.isValid) {
            result.push(i1);
        }
        if (i2.isValid && !i1.equals(i2)) {
            result.push(i2);
        }
    }

    if (result.length > 0) {
        return result;
    } else {
        return [departureInterval];
    }
}

export function coerceIntervals(intervals: ReadonlyArray<Interval>, dateWrapper: CharterDateWrapper): ReadonlyArray<Interval> {
    const minDate = parseLocalDateTime(dateWrapper.dateMin);
    const maxDate = parseLocalDateTime(dateWrapper.dateMax);
    const result: Array<Interval> = [];
    intervals.forEach((it) => {
        const newInterval = Interval.fromLocal(
            it.start.isAfter(minDate) ? it.start : minDate,
            it.end.isBefore(maxDate) ? it.end : maxDate,
            it.zone
        );
        if (newInterval.isValid) {
            result.push(newInterval);
        }
    });
    return result;
}


