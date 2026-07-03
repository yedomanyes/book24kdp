import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('books').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const book = data.find(b => b.title && b.title.includes('Süchte'));
  if (!book) {
    console.log('Book not found. Available books:');
    console.log(data.map(b => b.title));
    return;
  }

  console.log('Book found:', book.title, 'ID:', book.id);
  console.log('--- Page 65 Text ---');
  console.log(book.pagesText?.[65] || 'Empty');
  console.log('--- Page 66 Text ---');
  console.log(book.pagesText?.[66] || 'Empty');
  console.log('--- Page 67 Text ---');
  console.log(book.pagesText?.[67] || 'Empty');
  console.log('--- Page 68 Text ---');
  console.log(book.pagesText?.[68] || 'Empty');
  console.log('--- Page 69 Text ---');
  console.log(book.pagesText?.[69] || 'Empty');
  console.log('--- Pages keys ---');
  console.log(Object.keys(book.pagesText || {}).sort((a,b)=>a-b));
}
main();
