import { XActivity } from './XActivity';
import { XObservation } from './XObservation';
import { Xgeodata } from './Xgeodata';
import { XPlace } from './XPlace';
import { XTrip } from './XTrip';
import { Xuser } from './Xuser';

/**
 * Model definition for Comment
 */
export interface XComment {
  data: {
    id?: string;
    attributes?: {
      position?: Xgeodata;
      trip?: XTrip;
      observation?: XObservation;
      place?: XPlace;
      activity?: XActivity;
      creator?: Xuser;
      text?: string;
      createdAt?: string;
    };
  };
}

export interface XCommentPostReq {
  data: {
    position?: Xgeodata;
    text?: string;
    activity?: number;
    observation?: number;
    trip?: number;
    place?: number;
    creator?: number;
  };
}
