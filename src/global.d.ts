import type { Database as DB } from "./types/database.types";

declare global {
    type Database = DB;
    type Profile = DB['public']['Tables']['profiles']['Row'];
    type DB_Properties = DB['public']['Tables']['properties']['Row'];
    type DB_Unit_Types = DB['public']['Tables']['unit_types']['Row'];

}
