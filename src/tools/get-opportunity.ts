import { z } from "zod";
import { createSupabaseClient } from "./supabase-client";

export const getOpportunitySchema = {
	id: z.string().uuid("Valid UUID required"),
};

export async function getOpportunity(params: any) {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("opportunities")
		.select("*")
		.eq("id", params.id)
		.single();
	
	if (error) {
		if (error.code === "PGRST116") {
			throw new Error(`Opportunity not found with id: ${params.id}`);
		}
		throw new Error(`Failed to fetch opportunity: ${error.message}`);
	}
	
	return {
		success: true,
		opportunity: data,
	};
}