import { createClient } from "@supabase/supabase-js";

export const createSupabaseClient = () => {
	// Use environment variables - these are now set as secrets in Cloudflare Workers
	const supabaseUrl = "https://fbwgavsxokjntjcsnett.supabase.co";
	const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid2dhdnN4b2tqbnRqY3NuZXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjUyNjMsImV4cCI6MjA2NzY0MTI2M30.6NS15ED9dDQFQu3IoZJUj09I_GOlUpQJTrqKqKtl1IM";
	
	return createClient(supabaseUrl, supabaseKey);
};

export type OpportunityType = "RFQ" | "RFI" | "RTEP" | "Other";
export type OpportunityPriority = "1 - Top" | "2 - Nice to Have" | "3 - Maybe" | "4 - No Bid";
export type OpportunityStatus = "Not Started" | "Pre-Capture" | "Capture" | "Proposal" | "Submitted" | "Won" | "Lost" | "No Bid";
export type PrimeSubType = "Prime" | "Sub";
export type NewRecompeteType = "New" | "Recompete" | "Vehicle";

export interface Opportunity {
	id: string;
	created_at: string;
	updated_at: string;
	opportunity_name: string;
	agency: string;
	vehicle?: string;
	sub_vehicle?: string;
	type?: OpportunityType;
	priority?: OpportunityPriority;
	rfi_due?: string;
	rfi_submitted?: boolean;
	status?: OpportunityStatus;
	anticipated_solicitation_release?: string;
	anticipated_award?: string;
	actual_solicitation_release?: string;
	submission_due?: string;
	award_date?: string;
	start_date?: string;
	bidding_entity?: string;
	prime_sub?: PrimeSubType;
	prime_name_or_partners?: string;
	new_recompete?: NewRecompeteType;
	outcome?: string;
	awardee?: string;
	period_of_performance?: string;
	est_value?: number;
	est_fte?: number;
	notes?: string;
	owner_id?: string;
}