export declare const WORKFLOW_PERMISSION_ALIASES: Readonly<Record<string, readonly string[]>>;
export declare function satisfiesWorkflowPermission(granted: readonly string[], required: string): boolean;
export declare function hasWorkflowPermission(granted: readonly string[], required: string): boolean;
export declare function hasAnyWorkflowPermission(granted: readonly string[], required: readonly string[]): boolean;
export declare function hasAdminAssignOverride(granted: readonly string[]): boolean;
