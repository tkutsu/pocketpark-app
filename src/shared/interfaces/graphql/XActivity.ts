import { Xfile } from "./Xfile";
import { XComment } from "./XComment";
import { Xgeodata } from "./Xgeodata";
import { Xlist } from "./Xlist";
import { Xuser } from "./Xuser";

/**
 * Model definition for Activity
 */
export interface XActivity {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      description?: string;
      age_min?: number;
      age_max?: number;
      players_min?: number;
      players_max?: number;
      month_min?: number;
      month_max?: number;
      comments?: { data?: XComment["data"][] };
      position?: Xgeodata;
      materials?: Xlist[];
      tags?: Xlist[];
      fav_users?: { data?: Xuser["data"][] };
      images?: { data?: Xfile["data"][] };
      steps?: Xlist[];
    };
  };
}
