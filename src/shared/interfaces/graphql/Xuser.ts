import { XActivity } from './XActivity';
import { XComment } from './XComment';
import { XObservation } from './XObservation';
import { XPlace } from './XPlace';
import { XTrip } from './XTrip';

/**
 * Model definition for user
 */
export interface Xuser {
  data: {
    id?: string;
    attributes?: {
      username?: string;
      email?: string;
      provider?: string;
      password?: string;
      resetPasswordToken?: string;
      confirmationToken?: string;
      confirmed?: boolean;
      blocked?: boolean;
      team?: string;
      team_radius?: string;
      trips?: { data?: XTrip['data'][]; };
      fav_trips?: { data?: XTrip['data'][]; };
      fav_places?: { data?: XPlace['data'][]; };
      fav_observations?: { data?: XObservation['data'][]; };
      observations?: { data?: XObservation['data'][]; };
      comments?: { data?: XComment['data'][]; };
      fav_activities?: { data?: XActivity['data'][]; };
    };
  };
}
