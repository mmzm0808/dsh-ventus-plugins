/**
 * The Ventus whale 3D model: a self-contained three.js scene built from the
 * DeepSeek whale contour (swept body + dorsal/pectoral/tail fins + eyes).
 * Ported from the interactive whale demo and adapted for the pet use case:
 * transparent background, gentle idle animation, no OrbitControls (the pet
 * host handles rotation/drag). The on-screen size is driven by the host
 * window size (the pet window scales with the size setting); the camera
 * fits the model into the canvas once at build time.
 *
 * The module owns its renderer lifecycle: createWhaleScene() returns a
 * handle with start/pause/rotate/dispose so the plugin fiber can clean
 * everything up.
 */
/** A running whale pet scene. */
export interface WhaleSceneHandle {
    /** The rendered canvas element (transparent background). */
    canvas: HTMLCanvasElement;
    /** Apply an incremental yaw rotation (radians) for drag-rotate. */
    rotateYaw(delta: number): void;
    /** Apply an incremental pitch rotation (radians) for vertical look. */
    rotatePitch(delta: number): void;
    /** Reset the accumulated rotation to the identity. */
    resetRotation(): void;
    /** Trigger a jump bounce (double-click). */
    jump(): void;
    /** Trigger a 360° front somersault on the world X axis (message send). */
    flip(): void;
    /** Spawn a heart burst at the head crown (single click). */
    burstHearts(): void;
    /** Spawn a bubble burst at the head crown. */
    burstBubbles(): void;
    /** Pause the idle animation loop. */
    pause(): void;
    /** Resume the idle animation loop. */
    resume(): void;
    /** Release all WebGL resources and remove the canvas. */
    dispose(): void;
}
/**
 * Create the whale scene inside a container element.
 * @param container - the DOM element the canvas is appended to.
 * @returns the scene handle.
 */
export declare function createWhaleScene(container: HTMLElement): WhaleSceneHandle;
