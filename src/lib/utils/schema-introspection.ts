import { createSupabaseClient } from "../services/supabase-client";

export interface ColumnInfo {
	column_name: string;
	data_type: string;
	is_nullable: boolean;
	column_default?: string;
	character_maximum_length?: number;
	numeric_precision?: number;
	numeric_scale?: number;
}

export interface TableSchema {
	table_name: string;
	columns: ColumnInfo[];
}

/**
 * Introspects the database schema for a given table using information_schema
 */
export async function introspectTableSchema(tableName: string): Promise<TableSchema> {
	const supabase = createSupabaseClient();
	
	const { data, error } = await supabase
		.from("information_schema.columns")
		.select(`
			column_name,
			data_type,
			is_nullable,
			column_default,
			character_maximum_length,
			numeric_precision,
			numeric_scale
		`)
		.eq("table_name", tableName)
		.eq("table_schema", "public")
		.order("ordinal_position");
	
	if (error) {
		throw new Error(`Failed to introspect table schema: ${error.message}`);
	}
	
	return {
		table_name: tableName,
		columns: data.map((col: any) => ({
			column_name: col.column_name,
			data_type: col.data_type,
			is_nullable: col.is_nullable === "YES",
			column_default: col.column_default,
			character_maximum_length: col.character_maximum_length,
			numeric_precision: col.numeric_precision,
			numeric_scale: col.numeric_scale,
		}))
	};
}

/**
 * Converts database column information to Zod schema properties
 */
export function columnToZodSchema(column: ColumnInfo): string {
	const { column_name, data_type, is_nullable } = column;
	
	let zodType: string;
	
	switch (data_type) {
		case "text":
		case "character varying":
		case "varchar":
		case "character":
		case "char":
			zodType = "z.string()";
			break;
		case "integer":
		case "bigint":
		case "smallint":
			zodType = "z.number().int()";
			break;
		case "numeric":
		case "decimal":
		case "real":
		case "double precision":
		case "float":
			zodType = "z.number()";
			break;
		case "boolean":
			zodType = "z.boolean()";
			break;
		case "timestamp with time zone":
		case "timestamp without time zone":
		case "date":
		case "time":
			zodType = "z.string()";
			break;
		case "json":
		case "jsonb":
			zodType = "z.any()";
			break;
		case "uuid":
			zodType = "z.string().uuid()";
			break;
		default:
			zodType = "z.any()";
	}
	
	// Make optional if nullable or if it's an auto-generated field
	if (is_nullable || column_name === "id" || column_name === "created_at" || column_name === "updated_at") {
		zodType += ".optional()";
	}
	
	return `${column_name}: ${zodType}`;
}

/**
 * Generates a dynamic Zod schema object for a table
 */
export async function generateDynamicSchema(tableName: string): Promise<Record<string, any>> {
	const tableSchema = await introspectTableSchema(tableName);
	
	// Filter out auto-generated columns that shouldn't be in create operations
	const creatableColumns = tableSchema.columns.filter(col => 
		!["id", "created_at", "updated_at"].includes(col.column_name)
	);
	
	const schemaObj: Record<string, any> = {};
	
	for (const column of creatableColumns) {
		const { column_name, data_type, is_nullable } = column;
		
		let zodSchema: any;
		
		switch (data_type) {
			case "text":
			case "character varying":
			case "varchar":
			case "character":
			case "char":
				zodSchema = z.string();
				break;
			case "integer":
			case "bigint":
			case "smallint":
				zodSchema = z.number().int();
				break;
			case "numeric":
			case "decimal":
			case "real":
			case "double precision":
			case "float":
				zodSchema = z.number();
				break;
			case "boolean":
				zodSchema = z.boolean();
				break;
			case "timestamp with time zone":
			case "timestamp without time zone":
			case "date":
			case "time":
				zodSchema = z.string();
				break;
			case "json":
			case "jsonb":
				zodSchema = z.any();
				break;
			case "uuid":
				zodSchema = z.string().uuid();
				break;
			default:
				zodSchema = z.any();
		}
		
		// Make optional if nullable
		if (is_nullable) {
			zodSchema = zodSchema.optional();
		}
		
		schemaObj[column_name] = zodSchema;
	}
	
	return schemaObj;
}

// Import z for the schema generation
import { z } from "zod";