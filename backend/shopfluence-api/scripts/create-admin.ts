import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const prisma = new PrismaClient();

async function createAdmin() {
    const adminEmail = "admin@shopfluence.com";
    const adminPass = "ShopFluenceAdmin123!";
    
    console.log(`Checking for admin: ${adminEmail}...`);
    
    // Check if user already exists in Supabase
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const users = data?.users || [];
    const existingAuthUser = users.find(u => u.email === adminEmail);
    
    let authUserId: string;
    
    if (!existingAuthUser) {
        console.log("Creating admin user in Supabase Auth...");
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPass,
            email_confirm: true,
            user_metadata: {
                full_name: "Platform Admin",
                role: "ADMIN"
            }
        });
        
        if (createError) throw createError;
        authUserId = user!.id;
    } else {
        authUserId = existingAuthUser.id;
        console.log("Admin exists in Supabase, making sure role is set to ADMIN...");
        await supabase.auth.admin.updateUserById(authUserId, {
            user_metadata: { role: "ADMIN" }
        });
    }

    // Now sync to public.users if not already done
    const existingPublic = await prisma.user.findUnique({
        where: { id: authUserId }
    });

    if (!existingPublic) {
        console.log("Syncing admin to public.users table...");
        await prisma.user.create({
            data: {
                id: authUserId,
                email: adminEmail,
                firstName: "Platform",
                lastName: "Admin",
                role: "ADMIN",
                status: "ACTIVE",
                passwordHash: "SUPABASE_AUTH"
            }
        });
    } else {
        console.log("Admin exists in public table, ensuring role is correct...");
        await prisma.user.update({
            where: { id: authUserId },
            data: { role: "ADMIN", status: "ACTIVE" }
        });
    }
    
    console.log("Admin setup complete!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPass}`);
}

createAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
