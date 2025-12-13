import { getFollowSuggestions } from "@/app/data/user/get-follow-suggestions";
import { FollowSuggestions } from "./FollowSuggestions";

export async function FollowSuggestionsContainer() {
    const suggestions = await getFollowSuggestions();
    return <FollowSuggestions users={suggestions as any} />;
}
