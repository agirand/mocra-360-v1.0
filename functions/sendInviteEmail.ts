import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientEmail, workspaceName, role, inviterName } = await req.json();

    if (!recipientEmail || !workspaceName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roleName = role?.replace('workspace_', '').replace('_', ' ') || 'member';
    const appUrl = 'https://mocra360-v2.base44.app';

    const emailBody = `
Hello,

${inviterName || 'Someone'} has invited you to join the workspace "${workspaceName}" on MOCRA 360 as a ${roleName}.

Click the link below to accept your invitation and get started:
${appUrl}

If you don't have an account yet, you'll be able to create one when you visit the link.

Best regards,
MOCRA 360 Team
    `.trim();

    await base44.integrations.Core.SendEmail({
      from_name: 'MOCRA 360',
      to: recipientEmail,
      subject: `You've been invited to ${workspaceName}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending invite email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});