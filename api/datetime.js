export default function handler(req, res) {
  const today = new Date();

  const utcDateTime = today.toISOString(); // UTC datetime
  const torontoDayOfWeek = today.toLocaleString('en-CA', {
    weekday: 'long',
    timeZone: 'America/Toronto',
  });

  res.status(200).json({
    datetime: utcDateTime,
    dayOfWeek: torontoDayOfWeek,
    timezone: 'UTC'
  });
}
