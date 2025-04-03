export default function handler(req, res) {
  const today = new Date();
  const options = {
    timeZone: 'America/Toronto',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formattedDate = new Intl.DateTimeFormat('en-CA', options).format(today);

  res.status(200).json({
    datetime: formattedDate,
    dayOfWeek: new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'America/Toronto' }).format(today),
    timezone: 'America/Toronto'
  });
}
