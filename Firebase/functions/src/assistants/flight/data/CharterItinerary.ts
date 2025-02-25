/* tslint:disable */
/* eslint-disable */

import {CharterAirportsModel} from "./CharterAirportsModel";
import {CharterDateWrapper} from "./CharterDateWrapper";
import {CharterPaxWrapper} from "./CharterPaxWrapper";

/**
 * 
 * @export
 * @interface CharterItinerary
 */
export interface CharterItinerary {
    /**
     * 
     * @type {CharterAirportsModel}
     * @memberof CharterItinerary
     */
    readonly airports: CharterAirportsModel;
    /**
     * 
     * @type {CharterDateWrapper}
     * @memberof CharterItinerary
     */
    readonly dateWrapper: CharterDateWrapper;
    /**
     * 
     * @type {CharterPaxWrapper}
     * @memberof CharterItinerary
     */
    readonly pax: CharterPaxWrapper;
}
