const { createClient } = require('@supabase/supabase-js');

const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../.env.local');
const bgContent = fs.readFileSync(envPath, 'utf8');
bgContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
    const email = 'Fguio@anferjo.com';
    const password = '@Cxntrxldxprxdxccxxn2007';

    console.log("Creating/Updating Admin user:", email);

    let hasMore = true;
    let page = 1;
    let existingUser = null;

    while (hasMore) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: 1000
        });

        if (listError || users.length === 0) {
            hasMore = false;
            break;
        }

        const found = users.find(u => u.email === email);
        if (found) {
            existingUser = found;
            break;
        }

        page++;
    }

    if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password });
        console.log("Existing auth user updated.");
    } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: 'Fguio',
                dni: 'ADMIN001'
            }
        });
        if (error) {
            console.error("Auth Error:", error);
            return;
        }
        existingUser = data.user;
        console.log("Auth user created:", existingUser.id);
    }

    // Upsert into public.users
    await supabaseAdmin.from('users').upsert({
        id: existingUser.id,
        dni: 'ADMIN001',
        full_name: 'Fguio',
        role: 'admin',
        active: true
    }, { onConflict: 'id' });

    console.log("Public user created/updated.");
}

createAdmin();
