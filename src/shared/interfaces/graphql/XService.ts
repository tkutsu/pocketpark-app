/**
 * Model definition for service
 */

export enum EnumXService {
  information = "information",
  entrance_services = "entrance_services",
  drinking_water = "drinking_water",
  observation_point = "observation_point",
  toilet = "toilet",
  first_aid = "first_aid",
  fire_hydrant = "fire_hydrant",
  telephone = "telephone",
  parking = "parking",
}

export interface XService { value: EnumXService; }
