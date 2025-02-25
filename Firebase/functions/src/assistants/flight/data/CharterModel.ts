/* tslint:disable */
/* eslint-disable */

import {CharterItinerary} from "./CharterItinerary";

/**
 * 
 * @export
 * @interface CharterModel
 */
export interface CharterModel {
    /**
     * 
     * @type {Array<CharterItinerary>}
     * @memberof CharterModel
     */
    readonly segmentOptions: ReadonlyArray<CharterItinerary>;
    /**
     * 
     * @type {number}
     * @memberof CharterModel
     */
    readonly id: number;
}
