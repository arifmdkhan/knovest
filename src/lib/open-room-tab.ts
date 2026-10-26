/** Call synchronously from the user's click, before any network requests. */
export function openRoomTab(path: string): Window | null {
    const room = window.open(path, "_blank");
    if (room) room.opener = null;
    return room;
}
