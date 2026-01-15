/**
 * Admin House Edge Update Endpoint
 * 
 * Secure admin-only endpoint for updating house edge values.
 * Features:
 * - Admin authentication check
 * - Input validation
 * - Automatic audit logging via database trigger
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient, getUserFromRequest } from "../_shared/game-utils.ts";

interface UpdateRequest {
  gameId: string;
  houseEdge: number;  // 0.00 to 1.00 (e.g., 0.02 = 2%)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // 1. Authenticate user
    const { userId, error: authError } = await getUserFromRequest(req, supabase);
    if (authError) {
      return errorResponse(401, authError);
    }

    // 2. Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (userError || !user?.is_admin) {
      return errorResponse(403, "Admin access required");
    }

    // 3. Parse and validate request
    const body: UpdateRequest = await req.json();
    const { gameId, houseEdge } = body;

    if (!gameId) {
      return errorResponse(400, "Game ID required");
    }

    if (typeof houseEdge !== "number" || houseEdge < 0 || houseEdge > 1) {
      return errorResponse(400, "House edge must be between 0 and 1");
    }

    // 4. Update house edge (trigger will handle audit logging)
    const { data: game, error: updateError } = await supabase
      .from("games")
      .update({ 
        house_edge: houseEdge,
        updated_at: new Date().toISOString()
      })
      .eq("id", gameId)
      .select("id, name, house_edge")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return errorResponse(500, "Failed to update house edge");
    }

    // 5. Return success
    return new Response(JSON.stringify({
      success: true,
      game: {
        id: game.id,
        name: game.name,
        houseEdge: Number(game.house_edge),
      },
      message: `House edge updated to ${(houseEdge * 100).toFixed(2)}%`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Admin update error:", error);
    return errorResponse(500, error.message || "Internal server error");
  }
});

function errorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
