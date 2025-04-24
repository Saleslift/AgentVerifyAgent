import type {Database} from "./types/database.types";

declare global {
    type Profile = Database['public']['Tables']['profiles']['Row'];
}
