import { XComment } from './XComment';
import { Xfile } from './Xfile';
import { Xgeodata } from './Xgeodata';
import { Xuser } from './Xuser';
import { XProcess } from './XProcess';
import { XService } from './XService';

/**
 * Model definition for Place
 */
export interface XPlace {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      geodata?: Xgeodata[];
      description?: string;
      position?: Xgeodata;
      images?: { data: Xfile['data'][]; };
      processes?: { data: XProcess['data'][]; };
      type?: EnumXPlacetype;
      comments?: { data: XComment['data'][]; };
      fav_users?: { data: Xuser['data'][]; };
      services?: XService[];
      hex_color?: string;
    };
  };
}

export enum EnumXPlacetype {
  area = "area",
  path = "path",
  point = "point",
}
