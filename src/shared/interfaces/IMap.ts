import { Xgeodata } from 'shared/interfaces';

export enum EnumType {
  animals = 'animals',
  entrance = 'entrance',
  activities = 'activities',
  people = 'people',
  park = 'park',
  plants = 'plants',
  tours = 'tours',
  shadow = 'shadow',
  trips = 'trips',
  user = 'user',
  generic = 'generic',
  building = 'building'
}

export enum EnumDrawType {
  area = 'area',
  path = 'path',
  point = 'point',
}

export interface IMapContext {
  clicked?: {
    pos?: Xgeodata;
    uid?: string;
    type?: EnumType;
  };
  drawLast?: Xgeodata,
  drawTotal?: Xgeodata[];
  drawType?: EnumDrawType;
}
