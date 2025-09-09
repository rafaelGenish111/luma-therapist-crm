// בדיקת middleware
const auth = require('./src/middleware/auth');
const authorize = require('./src/middleware/authorize');

console.log('auth type:', typeof auth);
console.log('authorize type:', typeof authorize);
console.log('authorize() type:', typeof authorize(['therapist', 'admin']));

// בדיקה אם authorize מחזיר function
const authResult = authorize(['therapist', 'admin']);
console.log('authResult type:', typeof authResult);

if (typeof authResult !== 'function') {
    console.error('PROBLEM: authorize does not return a function!');
    console.log('authResult:', authResult);
} else {
    console.log('OK: authorize returns a function');
}


