import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const prisma = new PrismaClient();

async function syncExistingUsers() {
    console.log("Checking for existing users in auth.users...");
    
    // Get all users from auth.users (requires service_role)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error("Failed to list users from Supabase:", error);
        return;
    }

    console.log(`Found ${users.length} users in Supabase Auth.`);

    for (const authUser of users) {
        // Check if user already exists in public.users
        const existing = await prisma.user.findUnique({
            where: { id: authUser.id }
        });

        if (!existing) {
            console.log(`Syncing user: ${authUser.email} (${authUser.id})`);
            
            // Auto-confirm emails for development ease if not already confirmed
            if (!authUser.email_confirmed_at) {
                console.log(`Auto-confirming email for: ${authUser.email}`);
                await supabase.auth.admin.updateUserById(authUser.id, {
                    email_confirm: true
                });
            }

            await prisma.user.create({
                data: {
                    id: authUser.id,
                    email: authUser.email!,
                    firstName: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
                    lastName: authUser.user_metadata?.last_name || '',
                    role: (authUser.user_metadata?.role || "AFFILIATE").toUpperCase(),
                    status: 'ACTIVE',
                    passwordHash: 'SUPABASE_AUTH',
                    createdAt: authUser.created_at,
                    updatedAt: authUser.updated_at || authUser.created_at,
                }
            });
            
            // Create influencer profile if role is affiliate
            const role = (authUser.user_metadata?.role || "AFFILIATE").toUpperCase();
            if (role === "AFFILIATE") {
                await prisma.influencerProfile.upsert({
                    where: { userId: authUser.id },
                    update: {},
                    create: {
                        userId: authUser.id,
                        displayName: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
                    }
                });
            }
        } else {
            console.log(`User already exists in public table: ${authUser.email}`);
        }
    }
    
    console.log("Sync complete!");
}

syncExistingUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
