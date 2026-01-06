import { getSupabase } from '@/lib/supabase';
import 'dotenv/config';

export const supabase = getSupabase();

// Helper to log pipeline executions
export async function logExecution(
  workflowName: string,
  status: 'started' | 'completed' | 'failed',
  itemsProcessed?: number,
  itemsCreated?: number,
  errorMessage?: string
) {
  await supabase.from('pipeline_logs').insert({
    workflow_name: workflowName,
    status,
    items_processed: itemsProcessed,
    items_created: itemsCreated,
    error_message: errorMessage,
  });
}
