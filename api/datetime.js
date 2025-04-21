export default function handler(req, res) {

  const date = new Date();



  const options = {

    timeZone: 'America/Toronto',

    year: 'numeric',

    month: '2-digit',

    day: '2-digit',

    hour: 'numeric',

    minute: '2-digit',

    hour12: true,

  };



  const formattedDate = date.toLocaleString('en-CA', options).replace(',', '');



  res.status(200).json({

    datetime: formattedDate,

    dayOfWeek: date.toLocaleString('en-US', { weekday: 'long', timeZone: 'America/Toronto' }),

  });

}

