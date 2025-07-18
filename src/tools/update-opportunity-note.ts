import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

export const updateOpportunityNoteSchema = {
	id: z.string().uuid("Valid note UUID required"),
	text: z.string().min(1).optional(),
	date: z.string().datetime().optional(),
	attachments: z.array(z.string()).optional(),
};

export async function updateOpportunityNote(params: any) {
	const supabase = createSupabaseClient();
	
	const { id, ...updateData } = params;
	
	// First verify the note exists and get opportunity info
	const { data: existingNote, error: fetchError } = await supabase
		.from("opportunity_notes")
		.select("*, opportunities(opportunity_name)")
		.eq("id", id)
		.single();
	
	if (fetchError || !existingNote) {
		throw new Error(`Note not found with id: ${id}`);
	}
	
	// Update the note
	const { data, error } = await supabase
		.from("opportunity_notes")
		.update({
			...updateData,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();
	
	if (error) {
		throw new Error(`Failed to update note: ${error.message}`);
	}
	
	return {
		success: true,
		note: data,
		opportunity_name: existingNote.opportunities?.opportunity_name,
		message: `Successfully updated note for opportunity: ${existingNote.opportunities?.opportunity_name}`,
	};
}