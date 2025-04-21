/**
 * Calculates available time slots based on a start time, end time, and existing appointments.
 *
 * @param {string} startDateTime - The start date and time in UTC (e.g., "2025-04-21T12:00:00Z").
 * @param {string} endDateTime - The end date and time in UTC (e.g., "2025-04-21T18:00:00Z").
 * @param {Array<{start: string, end: string}>} currentAppointments - An array of existing appointments,
 * each with a start and end time in UTC.
 * @returns {{data: { [date: string]: { start: string }[] }, status: string}} - An object containing the available time slots,
 * keyed by date, and a status.
 */
export default function getAvailableTimeSlots(startDateTime, endDateTime, currentAppointments) {
    // Parse the start and end times into Date objects.
    const startTime = new Date(startDateTime);
    const endTime = new Date(endDateTime);

    // Extract the date part from the start time.  This will be the key in the result object.
    const startDateString = startTime.toISOString().split("T")[0];

    // Initialize the result object.
    const result = {
        data: {
            [startDateString]: [], // Initialize an empty array for the given date.
        },
        status: "success",
    };

    // If the start time is after the end time, return an empty data set.
    if (startTime >= endTime) {
        return result; // Return the initialized object, which will have an empty data array.
    }
  
    // Sort the current appointments by start time.  This makes the logic below easier.
    const sortedAppointments = [...currentAppointments].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Initialize the availableSlots array.  We'll add to this as we iterate.
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

    return result;
}
