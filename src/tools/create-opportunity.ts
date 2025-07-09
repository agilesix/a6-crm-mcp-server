import { z } from "zod";
import { createSupabaseClient } from "./supabase-client";

export const createOpportunitySchema = {
	opportunity_name: z.string().min(1, "Opportunity name is required"),
	agency: z.string().min(1, "Agency is required"),
	vehicle: z.string().optional(),
	sub_vehicle: z.string().optional(),
	type: z.enum(["RFQ", "RFI", "RTEP", "Other"]).optional(),
	priority: z.enum(["1 - Top", "2 - Nice to Have", "3 - Maybe", "4 - No Bid"]).optional(),
	rfi_due: z.string().optional(),
	rfi_submitted: z.boolean().optional(),
	status: z.enum(["Not Started", "Pre-Capture", "Capture", "Proposal", "Submitted", "Won", "Lost", "No Bid"]).optional(),
	anticipated_solicitation_release: z.string().optional(),
	anticipated_award: z.string().optional(),
	actual_solicitation_release: z.string().optional(),
	submission_due: z.string().optional(),
	award_date: z.string().optional(),
	start_date: z.string().optional(),
	bidding_entity: z.string().optional(),
	prime_sub: z.enum(["Prime", "Sub"]).optional(),
	prime_name_or_partners: z.string().optional(),
	new_recompete: z.enum(["New", "Recompete", "Vehicle"]).optional(),
	outcome: z.string().optional(),
	awardee: z.string().optional(),
	period_of_performance: z.string().optional(),
	est_value: z.number().optional(),
	est_fte: z.number().optional(),
	notes: z.string().optional(),
	owner_id: z.string().optional(),
};

export async function createOpportunity(params: any) {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("opportunities")
		.insert([params])
		.select()
		.single();
	
	if (error) {
		throw new Error(`Failed to create opportunity: ${error.message}`);
	}
	
	return {
		success: true,
		opportunity: data,
		message: `Successfully created opportunity: ${data.opportunity_name}`,
	};
}