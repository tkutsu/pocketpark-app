import { Xgeodata } from './Xgeodata';
import { Xuser } from './Xuser';
import { XTrip } from './XTrip';

/**
 * Model definition for Commentary
 */
export interface XCommentary {
  data: {
    id?: string;
    attributes?: {
      comments?: Xgeodata[];
      creator?: Xuser;
      trip?: XTrip;
    };
  };
}

export interface XCommentaryPostReq {
  data: {
    comments?: Xgeodata[];
    creator?: number;
    trip?: number;
  };
}
