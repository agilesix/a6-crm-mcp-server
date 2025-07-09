import { z } from "zod";
import { createSupabaseClient } from "./supabase-client";

export const deleteOpportunitySchema = {
	id: z.string().uuid("Valid UUID required"),
};

export async function deleteOpportunity(params: any) {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("opportunities")
		.delete()
		.eq("id", params.id)
		.select()
		.single();
	
	if (error) {
		if (error.code === "PGRST116") {
			throw new Error(`Opportunity not found with id: ${params.id}`);
		}
		throw new Error(`Failed to delete opportunity: ${error.message}`);
	}
	
	return {
		success: true,
		message: `Successfully deleted opportunity: ${data.opportunity_name}`,
		deleted_opportunity: data,
	};
}