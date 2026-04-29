export interface NewLeadEmailData {
  adminName: string;
  leadName: string;
  leadEmail: string;
  budget: number;
  source: string;
  priority: string;
  appUrl: string;
}

export interface LeadAssignedEmailData {
  agentName: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  propertyInterest: string;
  budget: number;
  appUrl: string;
  leadId: string;
}

export function newLeadEmail(d: NewLeadEmailData) {
  const budgetFmt = new Intl.NumberFormat("en-PK").format(d.budget);
  return {
    subject: `New lead: ${d.leadName} [${d.priority.toUpperCase()}]`,
    html: `
<p>Hi ${d.adminName},</p>
<p>A new lead has been submitted:</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td><strong>Name</strong></td><td>${d.leadName}</td></tr>
  <tr><td><strong>Email</strong></td><td>${d.leadEmail}</td></tr>
  <tr><td><strong>Budget</strong></td><td>PKR ${budgetFmt}</td></tr>
  <tr><td><strong>Source</strong></td><td>${d.source}</td></tr>
  <tr><td><strong>Priority</strong></td><td>${d.priority}</td></tr>
</table>
<p><a href="${d.appUrl}/admin/leads">View all leads →</a></p>`,
    text: `New lead: ${d.leadName}\nBudget: PKR ${budgetFmt}\nSource: ${d.source}\nPriority: ${d.priority}\n\n${d.appUrl}/admin/leads`,
  };
}

export function leadAssignedEmail(d: LeadAssignedEmailData) {
  const budgetFmt = new Intl.NumberFormat("en-PK").format(d.budget);
  return {
    subject: `Lead assigned to you: ${d.leadName}`,
    html: `
<p>Hi ${d.agentName},</p>
<p>A lead has been assigned to you:</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td><strong>Name</strong></td><td>${d.leadName}</td></tr>
  <tr><td><strong>Email</strong></td><td>${d.leadEmail}</td></tr>
  <tr><td><strong>Phone</strong></td><td>${d.leadPhone}</td></tr>
  <tr><td><strong>Interest</strong></td><td>${d.propertyInterest}</td></tr>
  <tr><td><strong>Budget</strong></td><td>PKR ${budgetFmt}</td></tr>
</table>
<p><a href="${d.appUrl}/agent/leads/${d.leadId}">Open lead →</a></p>`,
    text: `Lead assigned: ${d.leadName}\nPhone: ${d.leadPhone}\nBudget: PKR ${budgetFmt}\n\n${d.appUrl}/agent/leads/${d.leadId}`,
  };
}
