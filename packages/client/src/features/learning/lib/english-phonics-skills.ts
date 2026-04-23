export type EnglishBookId = 'book1' | 'book2' | 'book3' | 'book4' | 'book5';

export interface EnglishPhonicsBook {
  id: EnglishBookId;
  name: string;
  bookType:
    | 'letter-sounds'
    | 'short-vowels'
    | 'long-vowels'
    | 'blends-digraphs'
    | 'vowel-teams-r-controlled';
  phonemes: string[];
}

export const ENGLISH_PHONICS_BOOKS: EnglishPhonicsBook[] = [
  {
    id: 'book1',
    name: 'Book 1: Letter Sounds',
    bookType: 'letter-sounds',
    phonemes: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  },
  {
    id: 'book2',
    name: 'Book 2: Short Vowels',
    bookType: 'short-vowels',
    phonemes: ['a', 'e', 'i', 'o', 'u'],
  },
  {
    id: 'book3',
    name: 'Book 3: Long Vowels',
    bookType: 'long-vowels',
    phonemes: ['a_e', 'e_e', 'i_e', 'o_e', 'u_e'],
  },
  {
    id: 'book4',
    name: 'Book 4: Blends & Digraphs',
    bookType: 'blends-digraphs',
    phonemes: [
      'sh',
      'ch',
      'th',
      'ph',
      'wh',
      'bl',
      'cl',
      'fl',
      'gl',
      'pl',
      'sl',
      'br',
      'cr',
      'dr',
      'fr',
      'gr',
      'pr',
      'tr',
      'sk',
      'sm',
      'sn',
      'sp',
      'st',
      'sw',
    ],
  },
  {
    id: 'book5',
    name: 'Book 5: Vowel Teams & R-controlled',
    bookType: 'vowel-teams-r-controlled',
    phonemes: [
      'ar',
      'er',
      'ir',
      'or',
      'ur',
      'ee',
      'ea',
      'ai',
      'ay',
      'oa',
      'ow',
      'oi',
      'oy',
      'oo',
      'ou',
    ],
  },
];
