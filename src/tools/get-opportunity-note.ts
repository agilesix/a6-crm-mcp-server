import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

export const getOpportunityNoteSchema = {
	id: z.string().uuid("Valid note UUID required"),
};

export async function getOpportunityNote(params: any) {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("opportunity_notes")
		.select("*, opportunities(opportunity_name)")
		.eq("id", params.id)
		.single();
	
	if (error) {
		if (error.code === "PGRST116") {
			throw new Error(`Note not found with id: ${params.id}`);
		}
		throw new Error(`Failed to fetch note: ${error.message}`);
	}
	
	return {
		success: true,
		note: data,
		opportunity_name: data.opportunities?.opportunity_name,
	};
}