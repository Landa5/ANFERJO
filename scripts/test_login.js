
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').config({ path: envPath });

if (envConfig.error) {
    // If dotenv fails, try to parse manually or assume env vars are set
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(email, password) {
    console.log(`Testing login for: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error(`[FAIL] Login failed for ${email}:`);
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log(`[SUCCESS] Login successful for ${email}`);
        console.log(`User ID: ${data.user.id}`);
        // console.log(`Access Token: ${data.session.access_token.substring(0, 20)}...`);
    }
    console.log('---');
}

async function run() {
    // Test Admin (Should work)
    console.log("1. Testing Admin (Known Good)");
    await testLogin('admin@anferjo.com', 'admin'); // Assuming 'admin' or whatever the password is. 
    // Wait, I don't know admin password. The user knows it.
    // I won't test admin if I don't know the password, but the user said "info" failed even with admin password.
    // I know 'info@anferjo.com' has password 'Sel962650400' (or admin password if changed).
    // I know 'test_login@anferjo.com' has password 'Test123456'.

    console.log("2. Testing Info User (Recreated)");
    await testLogin('info@anferjo.com', 'Sel962650400');

    console.log("3. Testing Test User (Fresh)");
    await testLogin('test_login@anferjo.com', 'Test123456');
}

run();
