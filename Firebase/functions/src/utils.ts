import {DateTimeFormatter, DateTimeFormatterBuilder, LocalDate, LocalDateTime} from "@js-joda/core";

const dtFormatter = DateTimeFormatter.ofPattern( "yyyy-MM-dd['T'][' ']HH:mm[:ss]");
const dFormatter = new DateTimeFormatterBuilder().appendPattern("yyyy-MM-dd['T'][' '][HH:mm][:ss]").toFormatter();

export function parseLocalDateTime(from: string): LocalDateTime {
    return LocalDateTime.parse(from, dtFormatter);
}

export function parseLocalDate(from: string): LocalDate {
    return LocalDate.parse(from, dFormatter);
}
