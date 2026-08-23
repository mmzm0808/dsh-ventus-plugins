/**
 * Whale pet persistence: a small JSON file under the dsh home, atomically
 * published (temp + rename). Owned by this plugin; no other surface writes
 * it.
 */
import { type WhaleConfig } from './protocol.ts';
/** Load the persisted config, falling back to defaults on any problem. */
export declare function loadConfig(): WhaleConfig;
/** Persist the config atomically. */
export declare function saveConfig(config: WhaleConfig): void;
