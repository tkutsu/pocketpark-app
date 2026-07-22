import { Xfile } from './Xfile';
import { Xgeodata } from './Xgeodata';
import { Xlist } from './Xlist';

/**
 * Model definition for Park
 */
export interface XPark {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      description?: string;
      phone?: string;
      email?: string;
      entry?: Xgeodata;
      area?: Xgeodata[];
      images?: { data: Xfile['data'][] };
      logo?: Xfile;
      urls?: Xlist[];
      image_animal?: Xfile;
      image_plant?: Xfile;
      image_activity?: Xfile;
      image_place?: Xfile;
      image_trip?: Xfile;
      image_new_observation?: Xfile;
      image_new_trip?: Xfile;
      open_hours?: string;
      closed_unplanned?: boolean;
    }
  }
}
