import { createSupabaseClient } from "./lib/services/supabase-client";

export interface McpUser {
	id: string;
	google_id: string;
	email: string;
	full_name?: string;
	mcp_access: boolean;
	permissions: {
		list_opportunities: boolean;
		create_opportunity: boolean;
		update_opportunity: boolean;
		get_opportunity: boolean;
		delete_opportunity: boolean;
		// Opportunity Notes permissions
		create_opportunity_note: boolean;
		list_opportunity_notes: boolean;
		get_opportunity_note: boolean;
		update_opportunity_note: boolean;
		delete_opportunity_note: boolean;
	};
	allowed_user_id?: string;
	created_at: string;
	updated_at: string;
	last_login_at?: string;
}

export async function checkMcpAccess(googleId: string, email: string): Promise<McpUser | null> {
	const supabase = createSupabaseClient();
	
	// First try to find by Google ID (skip if empty string)
	if (googleId && googleId.trim() !== "") {
		const { data: googleUser, error: googleError } = await supabase
			.from("mcp_users")
			.select("*")
			.eq("google_id", googleId)
			.eq("mcp_access", true)
			.single();
		
		if (googleUser && !googleError) {
			return googleUser;
		}
	}
	
	// If not found by Google ID, try by email (for first-time users)
	const { data: emailUser, error: emailError } = await supabase
		.from("mcp_users")
		.select("*")
		.eq("email", email)
		.eq("mcp_access", true)
		.single();
	
	if (emailUser && !emailError) {
		// Update the Google ID for future logins
		await supabase
			.from("mcp_users")
			.update({ google_id: googleId })
			.eq("id", emailUser.id);
		
		return { ...emailUser, google_id: googleId };
	}
	
	if (emailError && emailError.code !== "PGRST116") {
		console.error("Error checking MCP access:", emailError);
	}
	
	return null;
}

export async function updateLastLogin(userId: string): Promise<void> {
	const supabase = createSupabaseClient();
	
	await supabase
		.from("mcp_users")
		.update({ 
			last_login_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq("id", userId);
}

export async function hasPermission(userPermissions: McpUser["permissions"], tool: string): Promise<boolean> {
	return userPermissions[tool as keyof McpUser["permissions"]] === true;
}

export async function createMcpUser(googleId: string, email: string, fullName: string): Promise<McpUser | null> {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("mcp_users")
		.insert([{
			google_id: googleId,
			email,
			full_name: fullName,
			mcp_access: false, // Default to no access - admin must enable
			permissions: {
				list_opportunities: true,
				create_opportunity: false,
				update_opportunity: false,
				get_opportunity: true,
				delete_opportunity: false,
				// Opportunity Notes permissions - default to read-only
				create_opportunity_note: false,
				list_opportunity_notes: true,
				get_opportunity_note: true,
				update_opportunity_note: false,
				delete_opportunity_note: false
			}
		}])
		.select()
		.single();
	
	if (error) {
		console.error("Error creating MCP user:", error);
		return null;
	}
	
	return data;
}