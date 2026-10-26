import type { Call } from "@stream-io/video-react-sdk";

/** Stream applies device defaults during get(), so preferences must be set first. */
export async function loadRoomCall(call: Pick<Call, "camera" | "microphone" | "get">) {
    await call.camera.disable();
    await call.microphone.disable();
    return call.get();
}
