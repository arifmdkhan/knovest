
/**
 * Generates a deterministic DM Channel ID based on participant IDs.
 * Matches logic: 'dm-' + sha256(sorted_case_sensitive_member_ids_joined_by_hyphen).substring(0, 32)
 *
 * @param currentUserId The ID of the current user
 * @param targetUserId The ID of the user to chat with
 * @returns Promise<string> The generated channel ID
 */
export async function getDmChannelId(currentUserId: string, targetUserId: string): Promise<string> {
    const members = [currentUserId, targetUserId].sort();
    const memberString = members.join('-');
    const msgBuffer = new TextEncoder().encode(memberString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `dm-${hashHex.substring(0, 32)}`;
}
