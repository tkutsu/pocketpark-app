import { Xlist } from './Xlist';
import { XTaxon } from './XTaxon';
import { XPlace } from './XPlace';

/**
 * Model definition for Process
 */
export interface XProcess {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      description?: string;
      urls?: Xlist[];
      taxons?: { data?: XTaxon['data'][] };
      places?: { data?: XPlace['data'][] };
    }
  }
}
