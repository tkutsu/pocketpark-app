import { XObservation } from './XObservation';
import { XMetadata } from './XMetadata';
import { XMeta_value } from './XMeta_value';
import { Xlist } from './Xlist';
import { Xfile } from './Xfile';
import { EnumType } from 'shared/interfaces/IMap';

/**
 * Model definition for Taxon
 */
export interface XTaxon {
  data: {
    id?: string;
    attributes?: {
      label?: string;
      species?: string;
      description?: string;
      observations?: { data?: XObservation['data'][] };
      metadata?: { data?: XMetadata['data'][] };
      urls?: Xlist[];
      meta_values?: XMeta_value[];
      type?: EnumType.animals | EnumType.plants;
      images?: { data?: Xfile['data'][] };
    }
  }
}
