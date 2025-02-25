/* tslint:disable */
/* eslint-disable */

import {AirportOpeningHours2} from "./AirportOpeningHours2";

/**
 * 
 * @export
 * @interface AirportSelectorItemModel
 */
export interface AirportSelectorItemModel {
    /**
     * Airport code from public.airports table
     * @type {string}
     * @memberof AirportSelectorItemModel
     */
    readonly code: string;
    /**
     * Airport working hours list
     * @type {Array<AirportOpeningHours2>}
     * @memberof AirportSelectorItemModel
     */
    readonly hours2: ReadonlyArray<AirportOpeningHours2>;
}
