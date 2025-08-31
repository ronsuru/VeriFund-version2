// Test script to check volunteer rating status
const volunteerId = '884b590e-2db1-4894-8615-9eed63eaabed'; // sshkitacc02@gmail.com
const campaignId = '93d29796-0b40-4741-af4a-deb0a646b9fa'; // The campaign ID from the error

console.log('Testing volunteer rating status...');
console.log('Volunteer ID:', volunteerId);
console.log('Campaign ID:', campaignId);

// Test the debug endpoint
fetch(`http://localhost:5000/api/volunteers/${volunteerId}/debug-rating-status?campaignId=${campaignId}`)
  .then(response => response.json())
  .then(data => {
    console.log('Debug Response:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Also test the regular reliability ratings endpoint
fetch(`http://localhost:5000/api/volunteers/${volunteerId}/reliability-ratings`)
  .then(response => response.json())
  .then(data => {
    console.log('\nAll Reliability Ratings:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
