export default function handler(req, res) {
  // Get the startDateTime and endDateTime from the query parameters.
  const { startDateTime, endDateTime } = req.query;

  // Check if startDateTime and endDateTime are provided
  if (!startDateTime || !endDateTime) {
    return res.status(400).json({ error: "startDateTime and endDateTime are required query parameters." });
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
    status: "success",
  };

  // If the start time is after the end time, return an empty data set.
  if (startTime >= endTime) {
    return res.status(200).json(result); // Changed to 200 for consistency
  }

  //  currentAppointments will also come from query params.  It will be a stringified JSON array.
    const currentAppointmentsParam = req.query.currentAppointments;
    let currentAppointments = [];

    if (currentAppointmentsParam) {
        try {
            currentAppointments = JSON.parse(currentAppointmentsParam);
            // Basic validation of the structure of each appointment object.
             for (const appointment of currentAppointments) {
                if (!appointment.start || !appointment.end) {
                    return res.status(400).json({ error: "Invalid currentAppointments format.  Each appointment must have 'start' and 'end' properties." });
                }
            }
        } catch (error) {
             return res.status(400).json({ error: "Invalid currentAppointments format.  Must be a valid JSON array of objects with start and end properties." });
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
    const filteredSlots = availableSlots.filter(slot => new Date(slot.start) >= startTime);


  // Add the available time slots to the result object.
  result.data[startDateString] = filteredSlots;

  res.status(200).json(result);
}
