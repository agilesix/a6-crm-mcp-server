import { z } from "zod";
import { createSupabaseClient } from "../lib/services/supabase-client";
import { generateDynamicSchema } from "../lib/utils/schema-introspection";

// Cache for the dynamic schema to avoid repeated database calls
let cachedSchema: Record<string, any> | null = null;
let schemaLastUpdated: number | null = null;
const SCHEMA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getCreateOpportunitySchema() {
	const now = Date.now();
	
	// Use cached schema if it's fresh (less than 5 minutes old)
	if (cachedSchema && schemaLastUpdated && (now - schemaLastUpdated) < SCHEMA_CACHE_DURATION) {
		return cachedSchema;
	}
	
	try {
		// Generate dynamic schema from database
		const dynamicSchema = await generateDynamicSchema("opportunities");
		
		// Apply business rules and constraints
		if (dynamicSchema.opportunity_name) {
			dynamicSchema.opportunity_name = z.string().min(1, "Opportunity name is required");
		}
		if (dynamicSchema.agency) {
			dynamicSchema.agency = z.string().min(1, "Agency is required");
		}
		
		// Apply enum constraints where we know the valid values
		if (dynamicSchema.type) {
			dynamicSchema.type = z.enum(["RFQ", "RFI", "RTEP", "Other"]).optional();
		}
		if (dynamicSchema.priority) {
			dynamicSchema.priority = z.enum(["1 - Top", "2 - Nice to Have", "3 - Maybe", "4 - No Bid"]).optional();
		}
		if (dynamicSchema.status) {
			dynamicSchema.status = z.enum(["Not Started", "Pre-Capture", "Capture", "Proposal", "Submitted", "Won", "Lost", "No Bid"]).optional();
		}
		if (dynamicSchema.prime_sub) {
			dynamicSchema.prime_sub = z.enum(["Prime", "Sub"]).optional();
		}
		if (dynamicSchema.new_recompete) {
			dynamicSchema.new_recompete = z.enum(["New", "Recompete", "Vehicle"]).optional();
		}
		
		// Cache the schema
		cachedSchema = dynamicSchema;
		schemaLastUpdated = now;
		
		return dynamicSchema;
	} catch (error) {
		console.error("Failed to generate dynamic schema, falling back to static schema:", error);
		
		// Fallback to static schema if dynamic generation fails
		return {
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
	}
}

// Export the function that returns the schema instead of a static schema
export const createOpportunitySchema = getCreateOpportunitySchema;

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