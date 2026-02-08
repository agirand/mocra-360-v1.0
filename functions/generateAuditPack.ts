import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, accountId, facilityId } = await req.json();

    if (!workspaceId || !accountId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch all data for the audit pack
    const filter = { workspaceId, accountId };
    if (facilityId) {
      filter.facilityId = facilityId;
    }

    const [account, facilities, equipment, tasks, evidence, signOffs] = await Promise.all([
      base44.entities.Account.filter({ id: accountId }),
      base44.entities.Facility.filter(facilityId ? { id: facilityId } : { workspaceId, accountId }),
      base44.entities.Equipment.filter(filter),
      base44.entities.MaintenanceTask.filter(filter),
      base44.entities.Evidence.filter(filter),
      base44.entities.SignOff.filter(filter)
    ]);

    const accountData = account[0] || {};
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => t.status === 'overdue');

    // Generate PDF
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Compliance Audit Pack', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 5;
    doc.text(`By: ${user.email}`, 20, y);
    y += 15;

    // Account Summary
    doc.setFontSize(16);
    doc.text('Account Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Name: ${accountData.name || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Type: ${accountData.accountType || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Status: ${accountData.complianceStatus || 'N/A'}`, 20, y);
    y += 15;

    // Facilities Summary
    doc.setFontSize(16);
    doc.text('Facilities', 20, y);
    y += 8;
    doc.setFontSize(10);
    facilities.forEach(facility => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${facility.name} (${facility.facilityType})`, 20, y);
      y += 6;
    });
    y += 10;

    // Equipment Summary
    doc.setFontSize(16);
    doc.text(`Equipment (${equipment.length} total)`, 20, y);
    y += 8;
    doc.setFontSize(10);
    const equipmentByStatus = equipment.reduce((acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(equipmentByStatus).forEach(([status, count]) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${status}: ${count}`, 20, y);
      y += 6;
    });
    y += 10;

    // Maintenance Tasks
    doc.setFontSize(16);
    doc.text('Maintenance Tasks', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total: ${tasks.length} | Completed: ${completedTasks.length} | Overdue: ${overdueTasks.length}`, 20, y);
    y += 10;

    // Overdue Tasks Detail
    if (overdueTasks.length > 0) {
      doc.setFontSize(14);
      doc.text('Overdue Tasks:', 20, y);
      y += 6;
      doc.setFontSize(9);
      overdueTasks.forEach(task => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`• ${task.title} (Due: ${task.dueDate})`, 20, y);
        y += 5;
      });
      y += 10;
    }

    // Evidence Summary
    doc.setFontSize(16);
    doc.text(`Evidence Records: ${evidence.length}`, 20, y);
    y += 10;

    // Sign-offs Summary
    doc.setFontSize(16);
    doc.text(`Sign-offs: ${signOffs.length}`, 20, y);
    y += 8;
    doc.setFontSize(9);
    signOffs.slice(0, 10).forEach(signOff => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${signOff.role} by ${signOff.signedBy} - ${new Date(signOff.signedAt).toLocaleString()}`, 20, y);
      y += 5;
    });

    // Create audit log entry
    await base44.entities.AuditEvent.create({
      workspaceId,
      accountId,
      entityName: 'AuditPack',
      entityId: facilityId || accountId,
      action: 'export',
      actor: user.email,
      actorId: user.id,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify({
        facilityId,
        equipmentCount: equipment.length,
        tasksCount: tasks.length,
        evidenceCount: evidence.length,
        signOffsCount: signOffs.length
      })
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=audit-pack-${accountData.name?.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating audit pack:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});