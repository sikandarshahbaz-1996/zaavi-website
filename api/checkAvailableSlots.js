export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { startDateTime, endDateTime, currentAppointments } = req.body;

  // Check if startDateTime and endDateTime are provided
  if (!startDateTime || !endDateTime) {
    return res.status(400).json({ error: 'startDateTime and endDateTime are required in the request body.' });
  }

  // Parse the start and end times into Date objects.
  const startTime = new Date(startDateTime);
  const endTime = new Date(endDateTime);

  // Extract the date part from the start time.
  const startDateString = startTime.toISOString().split('T')[0];

  // Initialize the result object.
  const result = {
    data: {
      [startDateString]: [],
    },
    status: 'success',
  };

  // If the start time is after the end time, return an empty data set.
  if (startTime >= endTime) {
    return res.status(200).json(result);
  }

  // Ensure currentAppointments is an array
  if (!Array.isArray(currentAppointments)) {
    return res.status(400).json({ error: 'currentAppointments must be an array.' });
  }

  // Basic validation of the structure of each appointment object.
  for (const appointment of currentAppointments) {
    if (!appointment.start || !appointment.end) {
      return res.status(400).json({
        error: "Invalid currentAppointments format. Each appointment must have 'start' and 'end' properties.",
      });
    }
  }

  // Sort the current appointments by start time.
  const sortedAppointments = [...currentAppointments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const availableSlots = [];
  let currentSlotStart = new Date(startTime);

  // Function to check for overlaps
  const overlaps = (slotStart, existingAppointments) => {
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1); // Check for 1-hour overlap

    for (const appointment of existingAppointments) {
      const appointmentStart = new Date(appointment.start);
      const appointmentEnd = new Date(appointment.end);

      if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
        return true; // Overlap found
      }
    }
    return false; // No overlap
  };

  // Generate slots in 30-minute intervals
  while (currentSlotStart < endTime) {
    if (!overlaps(currentSlotStart, sortedAppointments)) {
      availableSlots.push({ start: currentSlotStart.toISOString() });
    }
    // Increment by 30 minutes
    currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000);
  }

  result.data[startDateString] = availableSlots;
  res.status(200).json(result);
}
