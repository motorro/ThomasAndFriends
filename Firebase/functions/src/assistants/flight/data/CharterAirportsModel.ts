/* tslint:disable */
/* eslint-disable */


import {AirportSelectorItemModel} from "./AirportSelectorItemModel";

/**
 * 
 * @export
 * @interface CharterAirportsModel
 */
export interface CharterAirportsModel {
    /**
     * 
     * @type {Array<AirportSelectorItemModel>}
     * @memberof CharterAirportsModel
     */
    readonly from: Array<AirportSelectorItemModel>;
    /**
     * 
     * @type {Array<AirportSelectorItemModel>}
     * @memberof CharterAirportsModel
     */
    readonly to: Array<AirportSelectorItemModel>;
    /**
     * \"KTEB-TNCA\":153,
     * @type {{ [key: string]: number | undefined; }}
     * @memberof CharterAirportsModel
     */
    readonly flightTimes: { [key: string]: number; };
}