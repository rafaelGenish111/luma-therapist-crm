const moment = require('moment');

/**
 * Generate ICS content for an appointment
 * Note: Times are exported in UTC with Z suffix to avoid TZ drift across clients.
 */
function generateAppointmentICS({ appointment, therapist, client, serverBaseUrl }) {
  const start = appointment.startTime ? new Date(appointment.startTime) : new Date();
  const end = appointment.endTime ? new Date(appointment.endTime) : new Date(start.getTime() + (appointment.duration || 60) * 60000);

  const dtStart = moment(start).utc().format('YYYYMMDD[T]HHmmss[Z]');
  const dtEnd = moment(end).utc().format('YYYYMMDD[T]HHmmss[Z]');
  const now = moment().utc().format('YYYYMMDD[T]HHmmss[Z]');

  const uid = `${appointment._id || moment(start).valueOf()}@luma-therapist-crm`;

  const summary = `${client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'פגישה'} - ${therapist ? `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() : 'מטפל/ת'}`;
  const descriptionLines = [];
  if (appointment.notes) descriptionLines.push(appointment.notes);
  if (appointment.meetingUrl) descriptionLines.push(`קישור לפגישה: ${appointment.meetingUrl}`);
  const description = descriptionLines.join('\n');

  const locationMap = {
    clinic: 'קליניקה',
    home: 'בית הלקוח',
    online: 'מקוון',
    therapist_home: 'בית המטפל/ת',
    outdoor: 'חוץ',
    other: 'אחר'
  };
  const locationText = locationMap[appointment.location] || appointment.location || '';

  const url = serverBaseUrl ? `${serverBaseUrl}` : '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Luma Therapist CRM//Appointment//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : 'DESCRIPTION:',
    locationText ? `LOCATION:${escapeText(locationText)}` : 'LOCATION:',
    url ? `URL:${escapeText(url)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return lines.join('\r\n');
}

function escapeText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

module.exports = { generateAppointmentICS };


