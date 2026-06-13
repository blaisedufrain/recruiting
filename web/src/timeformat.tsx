 const getTimeAsString = ((value: string) => {
      const dateObj = new Date(value);
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        return dateObj.toLocaleString('en-US', options)
  });

export default getTimeAsString;
