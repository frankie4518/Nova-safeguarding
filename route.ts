import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase for the server
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function sendWebhookLog(embed: any) {
  const webhookUrl = 'https://discord.com/api/webhooks/1479306633375911937/GKf9qjiy_mp6VLsYHfDBC20yEDtthOHZCU7GOnZ8bt6qmwj9sS5teVGhjFmy3QkBZzTT';
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (e) {
    console.error('Failed to send webhook log:', e);
  }
}

export async function POST(req: Request) {
  try {
    const { discordId, firebaseUid, code } = await req.json();

    if (!discordId || !firebaseUid || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID || '1213174374795055155';
    const requiredRoleId = process.env.DISCORD_REQUIRED_ROLE_ID || '1479289693236494417';
    const channelId = process.env.DISCORD_VERIFICATION_CHANNEL_ID || '1479290952089600060';

    if (!botToken || !guildId || !requiredRoleId || !channelId) {
      return NextResponse.json(
        { error: 'Server configuration missing. Please set all required environment variables.' },
        { status: 503 }
      );
    }

    // 1. Fetch recent messages from the verification channel
    const messagesRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=20`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!messagesRes.ok) {
      return NextResponse.json({ error: 'Failed to read Discord channel' }, { status: 500 });
    }

    const messages = await messagesRes.json();
    
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid response from Discord API' }, { status: 500 });
    }

    // Check if we are receiving messages but their content is empty (indicates missing Message Content Intent)
    const hasMessagesWithEmptyContent = messages.length > 0 && messages.every((msg: any) => msg.content === '' && msg.attachments?.length === 0 && msg.embeds?.length === 0);

    if (hasMessagesWithEmptyContent) {
      return NextResponse.json({ 
        error: 'Bot is missing the "Message Content Intent". Please enable it in the Discord Developer Portal under the Bot tab.' 
      }, { status: 403 });
    }
    
    // 2. Look for the code from the user
    const isNumericId = /^\d{17,20}$/.test(discordId);
    
    // Strip # discriminator if the user provided one (e.g., username#1234 -> username)
    const normalizedInputId = discordId.split('#')[0].toLowerCase();
    
    const matchingMessage = messages.find((msg: any) => {
      const isAuthorMatch = isNumericId 
        ? msg.author.id === discordId 
        : msg.author.username.toLowerCase() === normalizedInputId || 
          (msg.author.global_name && msg.author.global_name.toLowerCase() === discordId.toLowerCase());
      
      return isAuthorMatch && msg.content.trim() === code;
    });

    if (!matchingMessage) {
      // Return a 404 but include a helpful debug message if no messages were found at all
      if (messages.length === 0) {
        return NextResponse.json({ error: 'Verification code not found in channel yet.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Verification code not found in channel yet.' }, { status: 404 });
    }

    // 3. If found, fetch the user's roles from the guild
    const actualDiscordId = matchingMessage.author.id;
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${actualDiscordId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!memberRes.ok) {
      await sendWebhookLog({
        title: '❌ Verification Failed: Not in Server',
        color: 0xEF4444,
        description: `A user attempted to verify with Discord ID/Username \`${discordId}\`, but they are not in the server.`,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'User is not in the server.' }, { status: 404 });
    }

    const memberData = await memberRes.json();
    const hasRole = memberData.roles.includes(requiredRoleId);

    if (!hasRole) {
      await sendWebhookLog({
        title: '❌ Verification Failed: Missing Role',
        color: 0xF59E0B,
        description: `User <@${actualDiscordId}> (\`${discordId}\`) attempted to verify but does not have the required role (<@&${requiredRoleId}>).`,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'User does not have the required "Roblox Verified User" role.' }, { status: 403 });
    }

    // 4. Return the member data to the client so it can update Firestore
    const displayName = memberData.nick || memberData.user.global_name || memberData.user.username;

    await sendWebhookLog({
      title: '✅ User Verified Successfully',
      color: 0x10B981,
      fields: [
        { name: 'Discord User', value: `<@${actualDiscordId}> (${displayName})`, inline: true },
        { name: 'Firebase UID', value: `\`${firebaseUid}\``, inline: true }
      ],
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: memberData.user.id,
        username: memberData.user.username,
        displayName: displayName,
        roles: memberData.roles
      }
    });

  } catch (error) {
    console.error('Discord verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
