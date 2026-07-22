import { Xgeodata } from 'shared/interfaces';
import { EnumType } from './IMap';

export * from './IMap';
export * from './graphql';

export interface IStrapiError {
  statusCode: number;
  response: Response;
  error: string;
  message: [{ messages: [{ id: string; message: string; }]; }];
  data: [{ messages: [{ id: string; message: string; }]; }];
}

export interface IObservationAPI {
  meta_values?: { metadatum?: string, value?: string | undefined | null; }[];
  label?: string;
  description?: string;
  geo?: Xgeodata;
  id?: string;
  imageId?: string;
  taxonId?: string;
}

export interface IUserAPI {
  username?: string;
  team?: string;
  team_radius?: number;
  fav_observation?: number;
  fav_trip?: number;
  fav_place?: number;
  fav_activity?: number;
}

export interface IUserResREST {
  id: number;
  email: string;
  username: string;
  team?: string;
  team_radius?: number;
  fav_observations?: { id: number; label?: string; description?: string; }[];
  fav_trips?: { id: number; label?: string; description?: string; }[];
  fav_places?: { id: number; label?: string; description?: string; }[];
  fav_activities?: { id: number; label?: string; description?: string; }[];
  observations?: { id: number; label?: string; description?: string; }[];
  trips?: { id: number; label?: string; description?: string; }[];
}

export interface ITripAPI {
  id?: string;
  label?: string;
  description?: string;
  fav_users?: string[];
  path?: Xgeodata[];
  obsIds?: string[];
  imageId?: string;
}

export interface ICommentAPI {
  id?: string;
  type?: EnumType;
  comment?: string;
}


export interface ICommentaryAPI {
  commentaryId?: string;
  tripId?: string;
  comments?: Xgeodata[];
}

export interface ISocketUser {
  key?: string;
  longitude?: number;
  latitude?: number;
  oldKey?: string | null;
  team?: string | null;
}

export interface IUserContext {
  username?: string,
  password?: string,
  email?: string,
  id?: string,
  team?: string,
  latitude?: number;
  longitude?: number;
  oldId?: string;
  radius?: number;
}
