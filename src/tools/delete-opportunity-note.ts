import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

export const deleteOpportunityNoteSchema = {
	id: z.string().uuid("Valid note UUID required"),
};

export async function deleteOpportunityNote(params: any) {
	const supabase = createSupabaseClient();
	
	// First get the note details before deletion
	const { data: existingNote, error: fetchError } = await supabase
		.from("opportunity_notes")
		.select("*, opportunities(opportunity_name)")
		.eq("id", params.id)
		.single();
	
	if (fetchError || !existingNote) {
		throw new Error(`Note not found with id: ${params.id}`);
	}
	
	// Delete the note
	const { error } = await supabase
		.from("opportunity_notes")
		.delete()
		.eq("id", params.id);
	
	if (error) {
		throw new Error(`Failed to delete note: ${error.message}`);
	}
	
	return {
		success: true,
		deleted_note: {
			id: existingNote.id,
			text: existingNote.text,
			date: existingNote.date,
		},
		opportunity_name: existingNote.opportunities?.opportunity_name,
		message: `Successfully deleted note from opportunity: ${existingNote.opportunities?.opportunity_name}`,
	};
}