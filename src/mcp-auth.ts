import { createSupabaseClient } from "./tools/supabase-client";

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
	};
	allowed_user_id?: string;
	created_at: string;
	updated_at: string;
	last_login_at?: string;
}

export async function checkMcpAccess(googleId: string, email: string): Promise<McpUser | null> {
	const supabase = createSupabaseClient();
	
	// First try to find by Google ID
	let { data: user, error } = await supabase
		.from("mcp_users")
		.select("*")
		.eq("google_id", googleId)
		.eq("mcp_access", true)
		.single();
	
	// If not found by Google ID, try by email (for first-time users)
	if (error && error.code === "PGRST116") {
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
			
			user = { ...emailUser, google_id: googleId };
		}
	}
	
	if (error && error.code !== "PGRST116") {
		console.error("Error checking MCP access:", error);
		return null;
	}
	
	return user;
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
				delete_opportunity: false
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