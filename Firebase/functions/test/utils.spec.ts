import {parseLocalDate, parseLocalDateTime} from "../src/utils";
import {LocalDate, LocalDateTime} from "@js-joda/core";

describe("Utils", function() {
    describe("date-time parser", function() {
        it("parses 2024-06-26T10:00", function() {
            const date = parseLocalDateTime("2024-06-26T10:00");
            date.equals(LocalDateTime.of(2024, 6, 26, 10, 0)).should.be.true;
        });
        it("parses 2024-06-26 00:00", function() {
            const date = parseLocalDateTime("2024-06-26 10:00");
            date.equals(LocalDateTime.of(2024, 6, 26, 10, 0)).should.be.true;
        });
    });
    describe("date parser", function() {
        it("parses 2024-06-26T10:00", function() {
            const date = parseLocalDate("2024-06-26T10:00");
            date.equals(LocalDate.of(2024, 6, 26)).should.be.true;
        });
        it("parses 2024-06-26 10:00", function() {
            const date = parseLocalDate("2024-06-26 10:00");
            date.equals(LocalDate.of(2024, 6, 26)).should.be.true;
        });
        it("parses 2024-06-26", function() {
            const date = parseLocalDate("2024-06-26");
            date.equals(LocalDate.of(2024, 6, 26)).should.be.true;
        });
    });
});
