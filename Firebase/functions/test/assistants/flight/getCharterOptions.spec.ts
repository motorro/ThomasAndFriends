import {LocalDate, LocalDateTime, LocalTime, ZoneId} from "@js-joda/core";
import {
    buildRoute,
    calculateAirportDeparture,
    calculateAirportsDeparture,
    coerceIntervals,
    hoursToInterval,
    Route
} from "../../../src/assistants/flight/getCharterOptions";
import {CharterDateWrapper} from "../../../src/assistants/flight/data/CharterDateWrapper";
import {Interval} from "../../../src/data/Interval";
import {CharterItinerary} from "../../../src/assistants/flight/data/CharterItinerary";
import {SuggestAirportData} from "../../../src/assistants/flight/data/SuggestAirportData";

const airportData: readonly (readonly [string, SuggestAirportData])[] = [
    ["UUWW", {
        "code": "UUWW",
        "name": "Vnukovo Intl",
        "city": "Moscow",
        "lat": 55.599167,
        "lon": 37.273056,
        "timezone": "Europe/Moscow"
    }],
    ["EGLL", {
        "code": "EGLL",
        "name": "Heathrow",
        "city": "London",
        "lat": 51.4710888888889,
        "lon": -0.461913888888889,
        "timezone": "Europe/London"
    }],
    ["EGKK", {
        "code": "EGKK",
        "name": "London Gatwick",
        "city": "London",
        "lat": 51.148056,
        "lon": 0.190278,
        "timezone": "Europe/London"
    }]
];

describe("Charter options processor", function() {
    describe("calculateAirportsDeparture", function() {
        it("returns original interval if dest is 24h", function() {
            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 18, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 0, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 59).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns original interval if arrives after east", function() {
            // Same date
            // Arrival:               [   ]
            // Working hours:   [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns original interval if arrives before east", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:           [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 10, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 12, 0).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns original interval if arrives after west", function() {
            // Same date
            // Arrival:                 [   ]
            // Working hours:   [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 6, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 8, 0).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns original interval if arrives before west", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:           [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 9, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 11, 0).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns overlap interval if arrives after east", function() {
            // Same date
            // Arrival:            [   ]
            // Working hours:   [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 12, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 14, 0).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns overlap interval if arrives before east", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:     [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 9, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 11, 0).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(4, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(5, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns overlap interval if arrives after west", function() {
            // Same date
            // Arrival:            [   ]
            // Working hours:   [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns overlap interval if arrives before west", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:     [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 5, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 7, 0).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(4, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(5, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns overlap interval if arrives greater east", function() {
            // Same date
            // Arrival:         [        ]
            // Working hours:     [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 13, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 14, 30).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns overlap interval if arrives greater west", function() {
            // Same date
            // Arrival:         [        ]
            // Working hours:     [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 9, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 30).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns default interval if between working hours east", function() {
            // Same date
            // Arrival:             [   ]
            // Working hours: [   ]      [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 18, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 20, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 2, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 4, 0).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns default interval if between working hours west", function() {
            // Same date
            // Arrival:             [   ]
            // Working hours: [   ]      [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 22, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 2, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 4, 0).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            dep.start.equals(result[0].start).should.be.true;
            dep.end.equals(result[0].end).should.be.true;
        });

        it("returns part of next day if overlaps close east", function() {
            // Same date
            // Arrival:          [   ]
            // Working hours: [   ]      [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 18, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 20, 0).toString()
            }, ZoneId.of("Europe/London"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 12, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 30).toString()
            }, ZoneId.of("Europe/Moscow"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(18, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(18, 30).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns part of next day if overlaps close west", function() {
            // Same date
            // Arrival:          [   ]
            // Working hours: [   ]      [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 22, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 30).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 23, 40).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 50).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(22, 40).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(22, 50).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns part of next day if overlaps open east", function() {
            // Same date
            // Arrival:                [   ]
            // Working hours: [   ]      [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 18, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 20, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 7, 0, 30).toString(),
                close: LocalDateTime.of(2022, 6, 7, 12, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(1);
            LocalTime.of(19, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(20, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns part of next day if overlaps open west", function() {
            // Same date
            // Arrival:                [   ]
            // Working hours: [   ]      [   ]

            const dep = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 18, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 20, 0).toString()
            }, ZoneId.of("Europe/Moscow"));
            const arr = hoursToInterval({
                open: LocalDateTime.of(2022, 6, 6, 12, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 19, 30).toString()
            }, ZoneId.of("Europe/London"));

            const result = calculateAirportDeparture(
                dep,
                arr,
                180
            );

            result.length.should.be.equal(1);
            LocalTime.of(18, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(18, 30).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("returns before and after close if closed with departure east", function() {
            // Same date
            // Arrival:         [           ]
            // Working hours: [   ]       [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 17, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 21, 0).toString()
            };
            const arr1 = {
                open: LocalDateTime.of(2022, 6, 6, 1, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 0).toString()
            };
            const arr2 = {
                open: LocalDateTime.of(2022, 6, 7, 1, 0).toString(),
                close: LocalDateTime.of(2022, 6, 7, 23, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr1, arr2],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(2);
            LocalTime.of(17, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(18, 0).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(20, 0).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(21, 0).equals(result[1].end.toLocalTime()).should.be.true;
        });

        it("returns before and after close if closed with departure west", function() {
            // Same date
            // Arrival:         [           ]
            // Working hours: [   ]       [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 20, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 30).toString()
            };
            const arr1 = {
                open: LocalDateTime.of(2022, 6, 6, 0, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 23, 0).toString()
            };
            const arr2 = {
                open: LocalDateTime.of(2022, 6, 7, 0, 0).toString(),
                close: LocalDateTime.of(2022, 6, 7, 23, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr1, arr2],
                180,
                ZoneId.of("Europe/Moscow"),
                ZoneId.of("Europe/London")
            );

            result.length.should.be.equal(2);
            LocalTime.of(20, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(22, 0).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(23, 0).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(23, 30).equals(result[1].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap if arrives before east", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:     [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 9, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 11, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(1);
            LocalTime.of(4, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(5, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap if arrives after west", function() {
            // Same date
            // Arrival:            [   ]
            // Working hours:   [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr],
                180,
                ZoneId.of("Europe/Moscow"),
                ZoneId.of("Europe/London")
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap if arrives before west", function() {
            // Same date
            // Arrival:         [   ]
            // Working hours:     [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 3, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 5, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 5, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 7, 0).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr],
                180,
                ZoneId.of("Europe/Moscow"),
                ZoneId.of("Europe/London")
            );

            result.length.should.be.equal(1);
            LocalTime.of(4, 0).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(5, 0).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap if arrives greater east", function() {
            // Same date
            // Arrival:       [        ]
            // Working hours:   [   ]

            const dep = {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 13, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 14, 30).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(1);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[0].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap of arrives greater east", function() {
            // Same date
            // Arrival:         [           ]
            // Working hours: [   ]       [   ]

            const dep1 = {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 8, 55).toString()
            };
            const dep2 = {
                open: LocalDateTime.of(2022, 6, 6, 9, 5).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 13, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 14, 30).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep1, dep2],
                [arr],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(2);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(8, 55).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(9, 5).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[1].end.toLocalTime()).should.be.true;
        });
        it("multi returns overlap of arrives greater west", function() {
            // Same date
            // Arrival:         [   ] [   ]
            // Working hours:     [     ]

            const dep1 = {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 8, 55).toString()
            };
            const dep2 = {
                open: LocalDateTime.of(2022, 6, 6, 9, 5).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr = {
                open: LocalDateTime.of(2022, 6, 6, 9, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 30).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep1, dep2],
                [arr],
                180,
                ZoneId.of("Europe/Moscow"),
                ZoneId.of("Europe/London")
            );

            result.length.should.be.equal(2);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(8, 55).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(9, 5).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[1].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap of departs greater east", function() {
            // Same date
            // Working hours:   [     ]
            // Arrival:       [   ] [   ]

            const dep= {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr1 = {
                open: LocalDateTime.of(2022, 6, 6, 13, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 13, 55).toString()
            };
            const arr2 = {
                open: LocalDateTime.of(2022, 6, 6, 14, 5).toString(),
                close: LocalDateTime.of(2022, 6, 6, 14, 30).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr1, arr2],
                180,
                ZoneId.of("Europe/London"),
                ZoneId.of("Europe/Moscow")
            );

            result.length.should.be.equal(2);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(8, 55).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(9, 5).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[1].end.toLocalTime()).should.be.true;
        });

        it("multi returns overlap of departs greater west", function() {
            // Same date
            // Working hours:   [     ]
            // Arrival:       [   ] [   ]

            const dep= {
                open: LocalDateTime.of(2022, 6, 6, 8, 0).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 0).toString()
            };
            const arr1 = {
                open: LocalDateTime.of(2022, 6, 6, 9, 30).toString(),
                close: LocalDateTime.of(2022, 6, 6, 9, 55).toString()
            };
            const arr2 = {
                open: LocalDateTime.of(2022, 6, 6, 10, 5).toString(),
                close: LocalDateTime.of(2022, 6, 6, 10, 30).toString()
            };

            const result = calculateAirportsDeparture(
                LocalDate.of(2022, 6, 6),
                [dep],
                [arr1, arr2],
                180,
                ZoneId.of("Europe/Moscow"),
                ZoneId.of("Europe/London")
            );

            result.length.should.be.equal(2);
            LocalTime.of(8, 30).equals(result[0].start.toLocalTime()).should.be.true;
            LocalTime.of(8, 55).equals(result[0].end.toLocalTime()).should.be.true;
            LocalTime.of(9, 5).equals(result[1].start.toLocalTime()).should.be.true;
            LocalTime.of(9, 30).equals(result[1].end.toLocalTime()).should.be.true;
        });
    });

    describe("coerceIntervals", function() {
        const dateWrapper: CharterDateWrapper = {
            dateMin: "2024-06-16T11:00",
            dateMax: "2024-06-16T12:00",
            dateLocal: "2024-06-16T12:30"
        };

        it("leaves as-is if interval fits", function() {
            const interval = Interval.fromLocal(
                LocalDateTime.of(2024, 6, 16, 11, 15),
                LocalDateTime.of(2024, 6, 16, 11, 45),
                ZoneId.of("Europe/Moscow")
            );
            const coerced = coerceIntervals([interval], dateWrapper);
            coerced.length.should.be.equal(1);
            interval.start.equals(coerced[0].start).should.be.true;
            interval.end.equals(coerced[0].end).should.be.true;
        });

        it("adjusts start if before limit", function() {
            const interval = Interval.fromLocal(
                LocalDateTime.of(2024, 6, 16, 10, 15),
                LocalDateTime.of(2024, 6, 16, 11, 45),
                ZoneId.of("Europe/Moscow")
            );
            const coerced = coerceIntervals([interval], dateWrapper);
            coerced.length.should.be.equal(1);
            LocalDateTime.of(2024, 6, 16, 11, 0).equals(coerced[0].start).should.be.true;
            interval.end.equals(coerced[0].end).should.be.true;
        });

        it("adjusts end if after limit", function() {
            const interval = Interval.fromLocal(
                LocalDateTime.of(2024, 6, 16, 11, 15),
                LocalDateTime.of(2024, 6, 16, 12, 45),
                ZoneId.of("Europe/Moscow")
            );
            const coerced = coerceIntervals([interval], dateWrapper);
            coerced.length.should.be.equal(1);
            interval.start.equals(coerced[0].start).should.be.true;
            LocalDateTime.of(2024, 6, 16, 12, 0).equals(coerced[0].end).should.be.true;
        });

        it("removes interval if before limit", function() {
            const interval = Interval.fromLocal(
                LocalDateTime.of(2024, 6, 16, 9, 15),
                LocalDateTime.of(2024, 6, 16, 10, 45),
                ZoneId.of("Europe/Moscow")
            );
            const coerced = coerceIntervals([interval], dateWrapper);
            coerced.length.should.be.equal(0);
        });

        it("removes interval if after limit", function() {
            const interval = Interval.fromLocal(
                LocalDateTime.of(2024, 6, 16, 13, 15),
                LocalDateTime.of(2024, 6, 16, 14, 45),
                ZoneId.of("Europe/Moscow")
            );
            const coerced = coerceIntervals([interval], dateWrapper);
            coerced.length.should.be.equal(0);
        });
    });

    describe("buildRoute", function() {
        const itinerary: CharterItinerary = {
            airports: {
                from: [{
                    code: "UUWW",
                    hours2: [
                        {
                            open: "2024-06-16T09:00",
                            close: "2024-06-16T23:00"
                        }
                    ]
                }],
                to: [
                    {
                        code: "EGLL",
                        hours2: [
                            {
                                open: "2024-06-16T09:00",
                                close: "2024-06-16T23:00"
                            }
                        ]
                    },
                    {
                        code: "EGKK",
                        hours2: [
                            {
                                open: "2024-06-16T09:00",
                                close: "2024-06-16T23:00"
                            }
                        ]
                    }
                ],
                flightTimes: {
                    "UUWW-EGLL": 3,
                    "UUWW-EGKK": 3.5
                }
            },
            dateWrapper: {
                dateMin: "2024-06-16T11:00",
                dateMax: "2024-06-16T13:00",
                dateLocal: "2024-06-16T12:00"
            },
            pax: {
                defaultPax: 1,
                maxPax: 10
            }
        };

        it("builds route", function() {
            const expectedData: Route = {
                from: {
                    id: "UUWW",
                    value: "Vnukovo Intl (Moscow)",
                    location: {
                        latitude: 55.599167,
                        longitude: 37.273056
                    },
                    types: [
                        "airport"
                    ]
                },
                destinations: [
                    {
                        to: {
                            id: "EGLL",
                            value: "Heathrow (London)",
                            types: [
                                "airport"
                            ],
                            location: {
                                latitude: 51.4710888888889,
                                longitude: -0.461913888888889
                            }
                        },
                        flightTimeMinutes: 180,
                        scheduleOptions: [
                            {
                                departure: {
                                    fromLocalTime: "2024-06-16T11:00",
                                    toLocalTime: "2024-06-16T13:00"
                                },
                                arrival: {
                                    fromLocalTime: "2024-06-16T12:00",
                                    toLocalTime: "2024-06-16T14:00"
                                }
                            }
                        ]
                    },
                    {
                        to: {
                            id: "EGKK",
                            value: "London Gatwick (London)",
                            types: [
                                "airport"
                            ],
                            location: {
                                latitude: 51.148056,
                                longitude: 0.190278
                            }
                        },
                        flightTimeMinutes: 210,
                        scheduleOptions: [
                            {
                                departure: {
                                    fromLocalTime: "2024-06-16T11:00",
                                    toLocalTime: "2024-06-16T13:00"
                                },
                                arrival: {
                                    fromLocalTime: "2024-06-16T12:30",
                                    toLocalTime: "2024-06-16T14:30"
                                }
                            }
                        ]
                    }
                ]
            };
            const route = buildRoute("UUWW", LocalDate.of(2024, 6, 16), itinerary, new Map(airportData));
            if (undefined === route) {
                throw new Error("Should create route");
            }
            route.should.deep.equal(expectedData);
        });
    });
});
