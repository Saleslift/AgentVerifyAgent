import type { Database as DB } from "./types/database.types";

declare global {
    type Database = DB;
    type DB_Profile = DB['public']['Tables']['profiles']['Row'];
    type AgencyAgent = DB['public']['Tables']['agency_agents']['Row'];
    type DB_Properties = DB['public']['Tables']['properties']['Row'];
    type DB_Unit_Types = DB['public']['Tables']['unit_types']['Row'];
    type DB_Agent_Unit_Types = DB['public']['Tables']['agent_unit_types']['Row'];
}
