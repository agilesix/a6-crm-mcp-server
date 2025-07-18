import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { GoogleHandler } from "./google-handler";

// Tool imports
import { listOpportunities, listOpportunitiesSchema } from "./tools/list-opportunities";
import { createOpportunity, createOpportunitySchema } from "./tools/create-opportunity";
import { updateOpportunity, updateOpportunitySchema } from "./tools/update-opportunity";
import { getOpportunity, getOpportunitySchema } from "./tools/get-opportunity";
import { deleteOpportunity, deleteOpportunitySchema } from "./tools/delete-opportunity";

// Context from the auth process, encrypted & stored in the auth token
// and provided to the MyMCP as this.props
type Props = {
	name: string;
	email: string;
	accessToken: string;
	mcpPermissions?: {
		list_opportunities: boolean;
		create_opportunity: boolean;
		update_opportunity: boolean;
		get_opportunity: boolean;
		delete_opportunity: boolean;
	};
};

export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
	server = new McpServer({
		name: "Agile Six CRM - Opportunity Management",
		version: "1.0.0",
	});

	private checkPermission(tool: keyof NonNullable<Props["mcpPermissions"]>) {
		return this.props.mcpPermissions?.[tool] === true;
	}

	private accessDeniedResponse(tool: string) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Access denied: You don't have permission to ${tool.replace("_", " ")}.`,
				},
			],
		};
	}

	async init() {
		// List opportunities tool
		this.server.tool(
			"list_opportunities",
			listOpportunitiesSchema,
			async (params) => {
				// Check permissions
				if (!this.checkPermission("list_opportunities")) {
					return this.accessDeniedResponse("list_opportunities");
				}

				try {
					const result = await listOpportunities(params);
					return {
						content: [
							{
								type: "text",
								text: `Found ${result.total} opportunities:\n\n${result.opportunities
									.map(
										(opp) =>
											`• [${opp.id}] ${opp.opportunity_name} (${opp.agency}) - Status: ${opp.status || "Not Started"} - Priority: ${opp.priority || "Not Set"}`
									)
									.join("\n")}\n\nShowing ${result.total} results (offset: ${result.offset}, limit: ${result.limit})`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error listing opportunities: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			}
		);

		// Create opportunity tool
		this.server.tool(
			"create_opportunity",
			createOpportunitySchema,
			async (params) => {
				// Check permissions
				if (!this.checkPermission("create_opportunity")) {
					return this.accessDeniedResponse("create_opportunity");
				}

				try {
					const result = await createOpportunity(params);
					return {
						content: [
							{
								type: "text",
								text: `${result.message}\n\nOpportunity Details:\n• ID: ${result.opportunity.id}\n• Name: ${result.opportunity.opportunity_name}\n• Agency: ${result.opportunity.agency}\n• Status: ${result.opportunity.status || "Not Started"}\n• Created: ${result.opportunity.created_at}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error creating opportunity: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			}
		);

		// Update opportunity tool
		this.server.tool(
			"update_opportunity",
			updateOpportunitySchema,
			async (params) => {
				// Check permissions
				if (!this.checkPermission("update_opportunity")) {
					return this.accessDeniedResponse("update_opportunity");
				}

				try {
					const result = await updateOpportunity(params);
					return {
						content: [
							{
								type: "text",
								text: `${result.message}\n\nUpdated Opportunity Details:\n• ID: ${result.opportunity.id}\n• Name: ${result.opportunity.opportunity_name}\n• Agency: ${result.opportunity.agency}\n• Status: ${result.opportunity.status || "Not Started"}\n• Updated: ${result.opportunity.updated_at}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error updating opportunity: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			}
		);

		// Get opportunity tool
		this.server.tool(
			"get_opportunity",
			getOpportunitySchema,
			async (params) => {
				// Check permissions
				if (!this.checkPermission("get_opportunity")) {
					return this.accessDeniedResponse("get_opportunity");
				}

				try {
					const result = await getOpportunity(params);
					const opp = result.opportunity;
					return {
						content: [
							{
								type: "text",
								text: `Opportunity Details:\n• ID: ${opp.id}\n• Name: ${opp.opportunity_name}\n• Agency: ${opp.agency}\n• Vehicle: ${opp.vehicle || "Not specified"}\n• Sub-vehicle: ${opp.sub_vehicle || "Not specified"}\n• Type: ${opp.type || "Not specified"}\n• Priority: ${opp.priority || "Not specified"}\n• Status: ${opp.status || "Not Started"}\n• Probability: ${opp.probability !== undefined ? `${opp.probability}%` : "Not specified"}\n• Solicitation Number: ${opp.solicitation_number || "Not specified"}\n• RFI Due: ${opp.rfi_due || "Not specified"}\n• RFI Submitted: ${opp.rfi_submitted ? "Yes" : "No"}\n• Anticipated Solicitation Release: ${opp.anticipated_solicitation_release || "Not specified"}\n• Anticipated Award: ${opp.anticipated_award || "Not specified"}\n• Actual Solicitation Release: ${opp.actual_solicitation_release || "Not specified"}\n• Submission Due: ${opp.submission_due || "Not specified"}\n• Award Date: ${opp.award_date || "Not specified"}\n• Start Date: ${opp.start_date || "Not specified"}\n• Bidding Entity: ${opp.bidding_entity || "Not specified"}\n• Prime/Sub: ${opp.prime_sub || "Not specified"}\n• New/Recompete: ${opp.new_recompete || "Not specified"}\n• Outcome: ${opp.outcome || "Not specified"}\n• Awardee: ${opp.awardee || "Not specified"}\n• Period of Performance: ${opp.period_of_performance || "Not specified"}\n• Estimated Value: ${opp.est_value ? `$${opp.est_value.toLocaleString()}` : "Not specified"}\n• Estimated FTE: ${opp.est_fte || "Not specified"}\n• LCATs: ${opp.lcats || "Not specified"}\n• Project Deliverables: ${opp.project_deliverables || "Not specified"}\n• Partner ID: ${opp.partner_id || "Not specified"}\n• Notes: ${opp.notes || "None"}\n• AI Research: ${opp.ai_research || "None"}\n• Created: ${opp.created_at}\n• Updated: ${opp.updated_at}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error retrieving opportunity: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			}
		);

		// Delete opportunity tool
		this.server.tool(
			"delete_opportunity",
			deleteOpportunitySchema,
			async (params) => {
				// Check permissions
				if (!this.checkPermission("delete_opportunity")) {
					return this.accessDeniedResponse("delete_opportunity");
				}

				try {
					const result = await deleteOpportunity(params);
					return {
						content: [
							{
								type: "text",
								text: `${result.message}\n\nDeleted Opportunity:\n• ID: ${result.deleted_opportunity.id}\n• Name: ${result.deleted_opportunity.opportunity_name}\n• Agency: ${result.deleted_opportunity.agency}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error deleting opportunity: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			}
		);
	}
}

export default new OAuthProvider({
	apiHandler: MyMCP.mount("/sse") as any,
	apiRoute: "/sse",
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: GoogleHandler as any,
	tokenEndpoint: "/token",
});