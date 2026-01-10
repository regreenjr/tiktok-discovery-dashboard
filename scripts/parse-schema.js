const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/supabase_schema.json', 'utf8'));
console.log('Tables available:', Object.keys(data.definitions));
console.log('\n--- competitor_videos schema ---');
console.log(JSON.stringify(data.definitions.competitor_videos, null, 2));
