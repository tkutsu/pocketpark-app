import { XComment } from './XComment';
import { XMeta_value } from './XMeta_value';
import { Xgeodata } from './Xgeodata';
import { XTaxon } from './XTaxon';
import { XTrip } from './XTrip';
import { Xfile } from './Xfile';
import { Xuser } from './Xuser';
import { XMeta_valuePostReq } from '.';

/**
 * Model definition for Observation
 */
export interface XObservation {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      description?: string;
      image?: Xfile;
      position?: Xgeodata;
      taxon?: XTaxon;
      meta_values?: XMeta_value[];
      trips?: { data?: XTrip['data'][] };
      comments?: { data?: XComment['data'][] };
      creator?: Xuser;
      fav_users?: { data?: Xuser['data'][] };
    }
  }
}

export interface XObservationPostReq {
  data: {
    label?: string;
    description?: string;
    position?: Xgeodata;
    meta_values?: XMeta_valuePostReq[];
    image?: number;
    taxon?: number;
    trips?: number[];
    comments?: number[];
    creator?: number;
    fav_users?: number[];
  }
}
