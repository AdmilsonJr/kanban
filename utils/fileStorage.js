const fs = require('fs').promises;
const path = require('path');

// Dictionary to hold the write promise chains for each file
// This acts as a simple file lock queue to prevent race conditions
const writeQueues = {};

/**
 * Ensures the directory exists before writing
 */
async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch (err) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Reads JSON data from a file
 * @param {string} file - Path to the file
 * @returns {Promise<Array|Object>} - Parsed JSON or empty array if file doesn't exist
 */
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or is empty/corrupt, return an empty array
    return [];
  }
}

/**
 * Writes data to a JSON file using a promise queue per file
 * @param {string} file - Path to the file
 * @param {Array|Object} data - Data to write
 * @returns {Promise<void>}
 */
function writeJSON(file, data) {
  // Initialize queue for this file if it doesn't exist
  if (!writeQueues[file]) {
    writeQueues[file] = Promise.resolve();
  }

  // Chain the new write operation onto the existing queue
  writeQueues[file] = writeQueues[file].then(async () => {
    await ensureDir(file);
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  }).catch(err => {
    console.error(`Error writing to ${file}:`, err);
    throw err;
  });

  return writeQueues[file];
}

module.exports = {
  readJSON,
  writeJSON
};
