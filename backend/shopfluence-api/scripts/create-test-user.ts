import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const prisma = new PrismaClient();

async function createTestUser() {
    const email = "test@shopfluence.com";
    const password = "Password123!";
    
    console.log(`Creating test user: ${email}...`);
    
    // Create in Supabase Auth
    const { data: { user }, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: "Test User",
            role: "ADMIN"
        }
    });
    
    if (error) {
        if (error.message.includes("already registered")) {
            console.log("User already exists, updating password...");
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (existing) {
                await supabase.auth.admin.updateUserById(existing.id, {
                    password,
                    email_confirm: true,
                    user_metadata: { role: "ADMIN" }
                });
                console.log("Updated existing user.");
            }
        } else {
            throw error;
        }
    } else {
        console.log("Created new user in Supabase Auth.");
    }

    // The trigger I created earlier should sync this user to public.users automatically!
    // But let's verify or manually sync just in case.
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const finalUser = users.find(u => u.email === email);
    
    if (finalUser) {
        const existingPublic = await prisma.user.findUnique({
            where: { id: finalUser.id }
        });
        
        if (!existingPublic) {
            console.log("Manual sync to public.users...");
            await prisma.user.create({
                data: {
                    id: finalUser.id,
                    email: finalUser.email!,
                    firstName: "Test",
                    lastName: "User",
                    role: "ADMIN",
                    status: "ACTIVE",
                    passwordHash: "SUPABASE_AUTH"
                }
            });
        } else {
             await prisma.user.update({
                where: { id: finalUser.id },
                data: { role: "ADMIN", status: "ACTIVE" }
            });
        }
    }
    
    console.log("\n==============================");
    console.log("Login Details Ready!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("Role: ADMIN (Full Access)");
    console.log("==============================\n");
}

createTestUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
