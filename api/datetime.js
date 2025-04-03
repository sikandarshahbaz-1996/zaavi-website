export default function handler(req, res) {
  const today = new Date();
  res.status(200).json({
    datetime: today.toISOString(),
    dayOfWeek: today.toLocaleString('en-US', { weekday: 'long' }),
  });
}
