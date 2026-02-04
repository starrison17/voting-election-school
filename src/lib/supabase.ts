import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://appmtbnlncknxktldrdn.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQxOGU1NTA2LThlNzAtNDgwMi05ODMwLTgzYzIwMjQ0MDhjMSJ9.eyJwcm9qZWN0SWQiOiJhcHBtdGJubG5ja254a3RsZHJkbiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NjczOTkyLCJleHAiOjIwODUwMzM5OTIsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.8Xs1BruGhK2DDb3xPDuekz22NbPIt6Gj9mqc1mmYueo';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };