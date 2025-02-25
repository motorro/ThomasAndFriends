/* tslint:disable */
/* eslint-disable */

/**
 * Airport data
 * @export
 * @interface SuggestAirportData
 */
export interface SuggestAirportData {
    /**
     * Airport code
     * @type {string}
     * @memberof SuggestAirportData
     */
    readonly code: string;
    /**
     * Airport name
     * @type {string}
     * @memberof SuggestAirportData
     */
    readonly name: string;
    /**
     * Airport city
     * @type {string}
     * @memberof SuggestAirportData
     */
    readonly city: string;
    /**
     * Airport latitude
     * @type {number}
     * @memberof SuggestAirportData
     */
    lat: number;
    /**
     * Airport longitude
     * @type {number}
     * @memberof SuggestAirportData
     */
    lon: number;
    /**
     * Airport timezone
     * @type {string}
     * @memberof SuggestAirportData
     */
    timezone?: string;
}
