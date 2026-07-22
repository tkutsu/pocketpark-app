import { XMetadata } from './XMetadata';

/**
 * Model definition for Meta_value
 */
export interface XMeta_value {
  id?: string;
  metadatum?: XMetadata;
  value?: string | null;
}
export interface XMeta_valuePostReq {
  id?: string;
  metadatum?: string;
  value?: string | null;
}
