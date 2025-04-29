// Import Intl polyfill if needed for older Node.js versions, though modern versions should support it.

export default async function handler(req, res) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Destructure required fields from the request body
  const { startDateTime, endDateTime, currentAppointments: rawAppointments } = req.body;

  // Check if mandatory startDateTime and endDateTime are provided
  if (!startDateTime || !endDateTime) {
    return res.status(400).json({ error: 'startDateTime and endDateTime are required in the request body.' });
  }

  let startTime, endTime;
  try {
    // Parse the input start and end times (expected in UTC ISO format) into Date objects.
    startTime = new Date(startDateTime);
    endTime = new Date(endDateTime);

    // Validate that the parsed dates are valid Date objects
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
       throw new Error('Invalid date format provided');
    }
  } catch (error) {
     // Log the error and return a 400 Bad Request if parsing fails
     console.error("Error parsing input dates:", error);
     return res.status(400).json({ error: 'Invalid startDateTime or endDateTime format provided.' });
  }


  // If the calculated start time is not before the end time, no slots are possible.
  // Return an empty array as per the requirement.
  if (startTime >= endTime) {
    return res.status(200).json([]);
  }

  // Handle the currentAppointments array: default to empty if not provided or null/undefined
  let currentAppointments = [];
  if (Array.isArray(rawAppointments)) {
      currentAppointments = rawAppointments;
  } else if (rawAppointments !== undefined && rawAppointments !== null) {
      // If it exists but isn't an array, return an error
      return res.status(400).json({ error: 'currentAppointments must be an array if provided.' });
  }

  // Validate the structure of each appointment object within the currentAppointments array.
  // Filter out any invalid entries.
  const validatedAppointments = currentAppointments.filter(appointment => {
      const isValid = appointment &&
             typeof appointment === 'object' &&
             appointment !== null &&
             typeof appointment.start === 'string' && // Ensure start is a string
             typeof appointment.end === 'string';   // Ensure end is a string
      if (!isValid) {
          console.warn("Filtering out invalid appointment structure:", appointment);
      }
      return isValid;
  });


  // Sort the validated existing appointments by their start time to efficiently check for overlaps.
  const sortedAppointments = [...validatedAppointments].sort(
    (a, b) => {
        try {
           // Add error handling for date parsing within sort
           const dateA = new Date(a.start);
           const dateB = new Date(b.start);
           if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0; // Keep original order if dates invalid
           return dateA.getTime() - dateB.getTime();
        } catch (e) {
            console.error("Error parsing date during sort:", e);
            return 0; // Keep original order on error
        }
    }
  );

  // Initialize an array to hold the calculated available slots.
  const availableSlots = [];
  // Initialize the starting point for slot generation.
  let currentSlotStart = new Date(startTime);

  // Helper function to check if a potential 1-hour slot overlaps with any existing appointments.
  const overlaps = (slotStart, existingAppointments) => {
    // Calculate the end of the potential 1-hour slot.
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // Add exactly 1 hour

    // Iterate through each existing appointment to check for time conflicts.
    for (const appointment of existingAppointments) {
      let appointmentStart, appointmentEnd;
      try {
          // Parse appointment start/end times, handling potential errors.
          appointmentStart = new Date(appointment.start);
          appointmentEnd = new Date(appointment.end);
          if (isNaN(appointmentStart.getTime()) || isNaN(appointmentEnd.getTime())) {
            console.warn("Skipping invalid appointment date during overlap check:", appointment);
            continue; // Skip this appointment if its dates are invalid
          }
      } catch (e) {
          console.error("Error parsing appointment date during overlap check:", e);
          continue; // Skip on error
      }

      // Standard overlap condition: (StartA < EndB) and (EndA > StartB)
      if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
        return true; // An overlap is found.
      }
    }
    return false; // No overlaps found for this slot.
  };

  // Define formatting options for Intl.DateTimeFormat to achieve "YYYY-MM-DD h:mmA" in EST/EDT.
  const formatOptions = {
    year: 'numeric',        // e.g., 2025
    month: '2-digit',       // e.g., 04
    day: '2-digit',         // e.g., 29
    hour: 'numeric',        // e.g., 8, 1, 3 (uses 1-12)
    minute: '2-digit',      // e.g., 00, 30, 35
    hour12: true,           // Use AM/PM
    timeZone: 'America/Toronto', // Automatically handle EST/EDT based on the date
  };

  // Create the formatter instance using US English locale for typical date part order.
  const formatter = new Intl.DateTimeFormat('en-US', formatOptions);

  // Loop to generate potential appointment slots in 30-minute increments.
  while (currentSlotStart < endTime) {
    // Ensure the current slot time is a valid date before checking overlaps.
    if (!isNaN(currentSlotStart.getTime())) {
        // Check if this potential slot overlaps with any existing appointments.
        if (!overlaps(currentSlotStart, sortedAppointments)) {
          // If no overlap, format the slot's start time to the desired EST/EDT string.
          try {
              const formattedParts = formatter.formatToParts(currentSlotStart).reduce((acc, part) => {
                acc[part.type] = part.value;
                return acc;
              }, {});

              // Construct the final string: YYYY-MM-DD h:mmAM/PM
              const formattedString = `${formattedParts.year}-${formattedParts.month}-${formattedParts.day} ${formattedParts.hour}:${formattedParts.minute}${formattedParts.dayPeriod.toUpperCase()}`;

              // Add the formatted slot to the results array.
              availableSlots.push({ start: formattedString });
          } catch (formatError) {
              console.error("Error formatting date:", currentSlotStart, formatError);
              // Decide how to handle formatting errors, e.g., skip this slot
          }
        }
    } else {
        // Log an error if an invalid date is encountered during generation.
        console.error("Encountered invalid date during slot generation, stopping loop.");
        break; // Exit the loop to prevent infinite loops or further errors.
    }

    // Increment the current slot time by 30 minutes for the next iteration.
    currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000);
  }

  // Return the final flat array of available slots, formatted correctly.
  res.status(200).json(availableSlots);
}
