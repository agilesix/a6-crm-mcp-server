import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

export const listOpportunityNotesSchema = {
	opportunity_id: z.string().uuid("Valid opportunity UUID required"),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	order_by: z.enum(["date", "created_at", "updated_at"]).default("date"),
	order_direction: z.enum(["asc", "desc"]).default("desc"),
};

export async function listOpportunityNotes(params: { 
	opportunity_id: string,
	limit: number,
	offset: number,
	order_by: "date" | "created_at" | "updated_at",
	order_direction: "asc" | "desc",
}) {
	const supabase = createSupabaseClient();
	
	// First get the opportunity name for context
	const { data: opportunity, error: oppError } = await supabase
		.from("opportunities")
		.select("id, opportunity_name")
		.eq("id", params.opportunity_id)
		.single();
	
	if (oppError || !opportunity) {
		throw new Error(`Opportunity not found with id: ${params.opportunity_id}`);
	}
	
	// Get the notes
	const { data, error, count } = await supabase
		.from("opportunity_notes")
		.select("*", { count: "exact" })
		.eq("opportunity_id", params.opportunity_id)
		.order(params.order_by, { ascending: params.order_direction === "asc" })
		.range(params.offset, params.offset + params.limit - 1);
	
	if (error) {
		throw new Error(`Failed to fetch notes: ${error.message}`);
	}
	
	return {
		notes: data || [],
		total: count || 0,
		offset: params.offset,
		limit: params.limit,
		opportunity_name: opportunity.opportunity_name,
	};
}