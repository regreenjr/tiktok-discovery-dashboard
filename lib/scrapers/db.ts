import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
