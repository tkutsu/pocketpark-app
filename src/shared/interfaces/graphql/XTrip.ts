import { Xfile } from './Xfile';
import { XComment } from './XComment';
import { XObservation } from './XObservation';
import { XCommentary } from './XCommentary';
import { Xgeodata } from './Xgeodata';
import { Xuser } from './Xuser';

/**
 * Model definition for Trip
 */
export interface XTrip {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      observations?: { data?: XObservation['data'][]; };
      commentaries?: { data?: XCommentary['data'][]; };
      description?: string;
      comments?: { data?: XComment['data'][]; };
      featured?: boolean;
      fav_users?: { data?: Xuser['data'][]; };
      path?: Xgeodata[];
      creator?: Xuser;
      image?: Xfile;
    };
  };
}

export interface XTripPostReq {
  data: {
    label?: string;
    description?: string;
    path?: Xgeodata[];
    observations?: number[];
    commentaries?: number[];
    comments?: number[];
    featured?: boolean;
    fav_users?: number[];
    creator?: number;
    image?: number;
  };
}
