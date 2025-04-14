import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Create a simple CORS headers object
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS
const handleCorsRequest = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsRequest();
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables");
    }

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get request body
    const requestData = await req.json();
    const { token } = requestData;

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, message: "Token is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("agent_invitations")
      .select(`
        id,
        email, 
        agency_id,
        agency:agency_id (
          id,
          full_name,
          agency_name,
          agency_logo
        ),
        expires_at
      `)
      .eq("token", token)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid or expired invitation" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const agencyName = invitation.agency?.agency_name || invitation.agency?.full_name || "Unknown Agency";

    return new Response(
      JSON.stringify({
        valid: true,
        invitation_id: invitation.id,
        agency_id: invitation.agency_id,
        agency_name: agencyName,
        email: invitation.email,
        expires_at: invitation.expires_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing invitation:", error);
    return new Response(
      JSON.stringify({ valid: false, message: "Failed to process invitation" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});