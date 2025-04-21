export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' }); // Handle only POST requests
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
  const startDateString = startTime.toISOString().split("T")[0];

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
      return res.status(400).json({ error: "Invalid currentAppointments format. Each appointment must have 'start' and 'end' properties." });
    }
  }

  // Sort the current appointments by start time.
  const sortedAppointments = [...currentAppointments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Initialize the availableSlots array.
  const availableSlots = [];

  // Initialize the current time slot start.
  let currentSlotStart = startTime;

  // Iterate through the sorted appointments.
  for (const appointment of sortedAppointments) {
    const appointmentStart = new Date(appointment.start);
    const appointmentEnd = new Date(appointment.end);

    // If there's a gap between the current time slot start and the start of this appointment,
    // then that gap is an available time slot.
    if (currentSlotStart < appointmentStart) {
      availableSlots.push({ start: currentSlotStart.toISOString() });
    }

    // The next available slot can only start *after* the current appointment ends.
    currentSlotStart = appointmentEnd;
  }

  // After we've processed all the existing appointments, there might be one last
  // available slot between the end of the last appointment and the endDateTime.
  if (currentSlotStart < endTime) {
    availableSlots.push({ start: currentSlotStart.toISOString() });
  }

  // Filter out any slots that are before the startDateTime
  const filteredSlots = availableSlots.filter(
    (slot) => new Date(slot.start) >= startTime
  );

  // Add the available time slots to the result object.
  result.data[startDateString] = filteredSlots;

  res.status(200).json(result);
}
