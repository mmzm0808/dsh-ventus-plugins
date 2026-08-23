/**
 * The /api/ventus-whale route family: state read + config write. Loopback
 * fence like every other plugin API; the pet config is local user state.
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
/** Build the route family. */
export declare function makeWhaleRoutes(): WebRoute[];
