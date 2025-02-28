const fs = require('fs');
const path = require('path');

// Function to format log entry into a more readable object
const formatLogEntry = (logEntry) => {
    try {
        // console.log(logEntry.message);

        const parsedEntry = JSON.parse(logEntry);
        // if(parsedEntry)
        const parsedMessage = JSON.parse(parsedEntry.message);
        
        // typeof parsedMessage === 
        // console.log(typeof logEntry);
        // return console.log(typeof parsedMessage);
        
        if((typeof parsedMessage) === 'object')
        {
            return {
                "Timestamp": parsedEntry.timestamp,
                "Method": parsedMessage.method,
                "URL": parsedMessage.url,
                "Status": parsedMessage.status,
                "Response_Time": `${parsedMessage.responseTime} ms`,
                "Content_Length": `${parsedMessage.contentLength} bytes`
            };
        }
        return {
            "message": parsedEntry.message
        }
    } catch (error) {
        console.error('Error parsing log entry:', error);
        return null; // Return null for invalid entries
    }
};

// Function to filter and remove old logs
const filterLogs = () => {
    const logFilePath = path.join(__dirname, 'app.log');

    // Read the log file
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            return;
        }

        // Split the log data into lines
        const logLines = data.split('\n').filter(line => line.trim() !== '');

        // Get the current date and the date 7 days ago
        const currentDate = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(currentDate.getDate() - 7);

        // Filter logs based on the date
        const filteredLogs = logLines.filter(line => {
            try {
                const logEntry = JSON.parse(line);
                const logDate = new Date(logEntry.timestamp);
                return logDate >= sevenDaysAgo && logDate <= currentDate;
            } catch (error) {
                console.error('Error parsing log line:', line, error);
                return false; // Exclude invalid log lines
            }
        });

        // Display the filtered logs
        if (filteredLogs.length > 0) {
            console.log('Filtered Logs (last 7 days):');
            filteredLogs.forEach(log => {
                const formattedLog = formatLogEntry(log);
                if (formattedLog) {
                    console.log(formattedLog);
                }
            });
        } else {
            console.log('No logs found for the last 7 days.');
        }

        // Write the filtered logs back to the log file
        fs.writeFile(logFilePath, filteredLogs.join('\n'), (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            } else {
                console.log('Old logs removed. Log file updated.');
            }
        });
    });
};

// Run the filterLogs function
filterLogs();