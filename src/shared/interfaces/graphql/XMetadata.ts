import { XTaxon } from './XTaxon';
import { Xfile } from './Xfile';
import { Xlist } from './Xlist';

/**
 * Model definition for Property
 */
export interface XMetadata {
  data: {
    id: string;
    attributes?: {
      unique_name?: string;
      label?: string;
      datatype?: EnumXMetaType;
      taxons?: { data?: XTaxon['data'][] };
      list_values?: Xlist[];
      description?: string;
      icon?: Xfile;
    }
  }
}

export enum EnumXMetaType {
  text = "text",
  number = "number",
  yesno = "yesno",
  list = "list",
}
