
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').config({ path: envPath });

if (envConfig.error) {
    console.log("Could not load .env.local via dotenv, trying manual parse");
    const bgContent = fs.readFileSync(envPath, 'utf8');
    bgContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to impersonate or just get data

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Testing Production Queries...");

    // Get User ID for info@anferjo.com
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'info@anferjo.com');

    if (!user) {
        console.error("User info@anferjo.com not found");
        return;
    }
    console.log(`User ID: ${user.id}`);

    // 1. Get Open Lots
    console.log("Fetching Open Lots...");
    const { data: openLots, error: lotsError } = await supabase
        .from('packaging_lots')
        .select('id, lot_code, reference:references(name)')
        .eq('status', 'open')
        .order('start_date', { ascending: false });

    if (lotsError) {
        console.error("Error fetching lots:", lotsError);
    } else {
        console.log("Open Lots:", JSON.stringify(openLots, null, 2));
    }

    // 2. Get Shift
    console.log("Fetching Shift...");
    const { data: shift, error: shiftError } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .single(); // This might error if no row

    if (shiftError) {
        console.log("Shift Error (Expected if none):", shiftError.message, shiftError.code);
    } else {
        console.log("Active Shift:", JSON.stringify(shift, null, 2));
    }

    // 3. Get Active Log
    let activeLog = null;
    if (shift) {
        console.log("Fetching Active Log...");
        const { data: log, error: logError } = await supabase
            .from('production_logs')
            .select(`
                *,
                packaging_lot:packaging_lots(lot_code),
                reference:references(code, name)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (logError) {
            console.log("Log Error:", logError.message);
        } else {
            activeLog = log;
            console.log("Active Log:", JSON.stringify(activeLog, null, 2));
        }
    } else {
        console.log("No active shift, skipping log fetch");
    }

}

run();
