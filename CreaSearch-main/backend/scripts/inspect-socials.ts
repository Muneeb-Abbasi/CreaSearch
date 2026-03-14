import 'dotenv/config';
import { getSupabaseClient } from '../src/services/database';
import fs from 'fs';

async function main() {
    const supabase = getSupabaseClient();
    
    const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, name, social_links')
        .order('created_at', { ascending: false })
        .limit(5);

    if (profileErr) {
        fs.writeFileSync('output-clean.txt', 'Error fetching profiles: ' + JSON.stringify(profileErr));
        return;
    }
    
    let output = 'Latest Profiles:\n';
    for (const p of profiles) {
        output += `\nProfile: ${p.name} (${p.id})\n`;
        output += `Social links JSONB: ${JSON.stringify(p.social_links)}\n`;
        
        const { data: accounts, error: accErr } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('profile_id', p.id);
            
        if (accErr) {
            output += `  Error fetching accounts: ${JSON.stringify(accErr)}\n`;
        } else {
            output += `  Social Accounts (count: ${accounts?.length || 0}):\n`;
            accounts?.forEach(a => {
                output += `    - Platform: ${a.platform}, Status: ${a.verification_status}, URL: ${a.platform_url}\n`;
            });
        }
    }
    fs.writeFileSync('output-clean.txt', output, 'utf8');
}

main().catch(err => fs.writeFileSync('output-clean.txt', 'Fatal error: ' + err.toString()));
