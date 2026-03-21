import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

async function testLogin() {
    console.log("Testing login for test@shopfluence.com...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@shopfluence.com',
        password: 'Password123!'
    });

    if (error) {
        console.error("Login failed:", error.message);
    } else {
        console.log("Login successful!");
        console.log("User ID:", data.user?.id);
        console.log("Session exists:", !!data.session);
    }
}

testLogin();
