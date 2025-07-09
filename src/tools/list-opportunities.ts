import { z } from "zod";
import { createSupabaseClient } from "./supabase-client";

export const listOpportunitiesSchema = {
	status: z.enum(["Not Started", "Pre-Capture", "Capture", "Proposal", "Submitted", "Won", "Lost", "No Bid"]).optional(),
	priority: z.enum(["1 - Top", "2 - Nice to Have", "3 - Maybe", "4 - No Bid"]).optional(),
	agency: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
};

export async function listOpportunities(params: { 
	status?: "Not Started" | "Pre-Capture" | "Capture" | "Proposal" | "Submitted" | "Won" | "Lost" | "No Bid",
	priority?: "1 - Top" | "2 - Nice to Have" | "3 - Maybe" | "4 - No Bid",
	agency?: string,
	limit: number,
	offset: number,
}) {
	const supabase = createSupabaseClient();
	
	let query = supabase
		.from("opportunities")
		.select("*")
		.order("created_at", { ascending: false });
	
	if (params.status) {
		query = query.eq("status", params.status);
	}
	
	if (params.priority) {
		query = query.eq("priority", params.priority);
	}
	
	if (params.agency) {
		query = query.ilike("agency", `%${params.agency}%`);
	}
	
	const { data, error } = await query
		.range(params.offset, params.offset + params.limit - 1);
	
	if (error) {
		throw new Error(`Failed to fetch opportunities: ${error.message}`);
	}
	
	return {
		opportunities: data || [],
		total: data?.length || 0,
		offset: params.offset,
		limit: params.limit,
	};
}