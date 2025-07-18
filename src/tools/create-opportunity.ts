import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";

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
	// prime_name_or_partners field has been removed from the table
	new_recompete: z.enum(["New", "Recompete", "Vehicle"]).optional(),
	outcome: z.string().optional(),
	awardee: z.string().optional(),
	period_of_performance: z.string().optional(),
	est_value: z.number().optional(),
	est_fte: z.number().optional(),
	notes: z.string().optional(),
	ai_research: z.string().optional().describe("AI research notes and analysis in markdown format. Use this field to store detailed research, analysis, competitive intelligence, and strategic insights about the opportunity."),
	// New fields added to the table
	partner_id: z.string().uuid().optional(),
	project_deliverables: z.string().optional(),
	lcats: z.string().optional(),
	solicitation_number: z.string().optional(),
	probability: z.number().int().min(0).max(100).optional(),
	// owner_id removed - not applicable for MCP anonymous access
};

export async function createOpportunity(params: any) {
	const supabase = createSupabaseClient();
	
	// Remove owner_id from params since we're using anonymous access
	// and don't have a valid auth.users ID
	const { owner_id, ...insertData } = params;
	
	const { data, error } = await supabase
		.from("opportunities")
		.insert([insertData])
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