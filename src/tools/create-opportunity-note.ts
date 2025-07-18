import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

export const createOpportunityNoteSchema = {
	opportunity_id: z.string().uuid("Valid opportunity UUID required"),
	text: z.string().min(1, "Note text is required"),
	date: z.string().datetime().optional().describe("ISO 8601 datetime for the note. Defaults to current timestamp if not provided"),
	attachments: z.array(z.string()).optional().describe("Array of attachment URLs or references"),
};

export async function createOpportunityNote(params: any) {
	const supabase = createSupabaseClient();
	
	// First verify the opportunity exists
	const { data: opportunity, error: oppError } = await supabase
		.from("opportunities")
		.select("id, opportunity_name")
		.eq("id", params.opportunity_id)
		.single();
	
	if (oppError || !opportunity) {
		throw new Error(`Opportunity not found with id: ${params.opportunity_id}`);
	}
	
	// Create the note
	const { data, error } = await supabase
		.from("opportunity_notes")
		.insert([{
			opportunity_id: params.opportunity_id,
			text: params.text,
			date: params.date || new Date().toISOString(),
			attachments: params.attachments || null,
		}])
		.select()
		.single();
	
	if (error) {
		throw new Error(`Failed to create note: ${error.message}`);
	}
	
	return {
		success: true,
		note: data,
		opportunity_name: opportunity.opportunity_name,
		message: `Successfully created note for opportunity: ${opportunity.opportunity_name}`,
	};
}