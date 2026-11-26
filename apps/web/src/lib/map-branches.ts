import type { Lane } from './explorer';

type Entry = { label: string; node?: string; href?: string };
type Branch = { id: Lane; label: string; cue: string; intro: string; groups: { label: string; entries: Entry[] }[] };

export const branches: Branch[] = [
  { id: 'mahabharata', label: 'Mahābhārata', cue: 'Court, exile and war', intro: 'Follow the story from the Kuru court to the forest, the battlefield and the debates after the war.', groups: [
    { label: 'Story arcs', entries: [{ label: 'The dice match', node: 'ma-episode-dice' }, { label: 'Into the forest', node: 'ma-episode-exile-start' }, { label: 'The peace mission', node: 'ma-episode-peace' }, { label: 'All eighteen war days', href: '/explorer/?lane=mahabharata&scope=war' }, { label: 'The aftermath', node: 'ma-episode-mourning' }] },
    { label: 'People and passages', entries: [{ label: 'Draupadī', node: 'ma-person-draupadi' }, { label: 'Karna', node: 'ma-person-karna' }, { label: 'Bhīṣma', node: 'ma-person-bhishma' }, { label: 'Kurukṣetra', node: 'ma-place-kurukshetra' }, { label: 'The BORI edition and eighteen parvas', href: '/library/#mahabharata' }] },
  ] },
  { id: 'ramayana', label: 'Rāmāyaṇa', cue: 'From Ayodhyā to Laṅkā', intro: 'Read how choices in Ayodhyā change the journey through the forest to Laṅkā and back.', groups: [
    { label: 'Story arcs', entries: [{ label: 'Sītā chooses to go', node: 'ra-episode-sita-exile' }, { label: 'Bharata brings back the sandals', node: 'ra-episode-bharata-sandals' }, { label: 'The Kiṣkindhā alliance', node: 'ra-episode-alliance' }, { label: 'Sītā recognizes the ring', node: 'ra-episode-ring' }, { label: 'The return to Ayodhyā', node: 'ra-episode-return' }] },
    { label: 'People, places and editions', entries: [{ label: 'Sītā', node: 'ra-person-sita' }, { label: 'Hanumān', node: 'ra-person-hanuman' }, { label: 'Laṅkā and the Aśoka grove', node: 'ra-place-lanka' }, { label: 'Compare Rāma’s birth passages', node: 'story-rama-birth' }, { label: 'The Baroda edition and seven kāṇḍas', href: '/library/#ramayana' }] },
  ] },
  { id: 'maratha', label: 'Swarajya and Maratha history', cue: 'Forts, records and campaigns', intro: 'Follow changes in authority through dated records, and see what the sources can tell us about forts and campaigns.', groups: [
    { label: 'Historical periods', entries: [{ label: 'The Deccan setting', node: 'maratha-period-deccan' }, { label: 'Shivaji Maharaj and Swarajya', node: 'maratha-period-shivaji' }, { label: 'Resistance and regency', node: 'maratha-period-resistance' }, { label: 'Satara and Shahu', node: 'maratha-period-satara' }, { label: 'Administration and expansion', node: 'maratha-period-administration' }, { label: 'The Panipat campaign', node: 'maratha-period-panipat' }, { label: 'Regional houses', node: 'maratha-period-houses' }, { label: 'The Company settlement', node: 'maratha-period-company' }, { label: 'Continuities after 1818', node: 'maratha-period-continuities' }] },
    { label: 'Forts, ports and documents', entries: [{ label: 'Raigad', node: 'maratha-place-raigad' }, { label: 'Compare the Agra accounts', node: 'maratha-event-escape' }, { label: 'The Vasai port account', node: 'maratha-event-vasai-port-account' }, { label: 'Panipat’s supply routes', node: 'maratha-event-panipat-supply' }, { label: 'Raigad terrain and fort cases', href: '/swarajya/' }] },
  ] },
  { id: 'purana', label: 'Kṛṣṇa and related texts', cue: 'Harivaṃśa and Purāṇa readings', intro: 'Read episodes about Kṛṣṇa across their named texts and follow the documented link to an observance.', groups: [
    { label: 'Readings and traditions', entries: [{ label: 'Kṛṣṇa', node: 'purana-person-krishna' }, { label: 'Kṛṣṇa’s birth', node: 'purana-episode-krishna-birth' }, { label: 'Kṛṣṇa in Gokula', node: 'purana-episode-krishna-gokula' }, { label: 'The Harivaṃśa arena account', node: 'purana-episode-harivamsa-kamsa' }, { label: 'Janmāṣṭamī', node: 'tradition-janmashtami' }, { label: 'Compare episodes across texts', href: '/krishna/' }] },
  ] },
  { id: 'sky', label: 'Sky & Calendar', cue: 'Daily tools and sky lessons', intro: 'Try a daily calculation, compare a festival example, or follow the sky from an observer’s point of view.', groups: [
    { label: 'Calculators and lessons', entries: [{ label: 'Pañchāṅga', node: 'tool-panchang' }, { label: 'Birth Sky', node: 'tool-birth-sky' }, { label: 'Observer sky', node: 'tool-observer' }, { label: 'Sūrya Siddhānta workshop', node: 'tool-mean-sun' }, { label: 'Nakshatra', node: 'concept-nakshatra' }] },
    { label: 'Festival examples', entries: [{ label: 'Rāma Navamī', node: 'tool-rama-navami' }, { label: 'Janmāṣṭamī', node: 'tradition-janmashtami' }] },
  ] },
  { id: 'research', label: 'Research and Sources', cue: 'Verses, claims and evidence', intro: 'Follow an interpretation back to its passage, then see the assumptions and the scope of the evidence.', groups: [
    { label: 'Dating investigations', entries: [{ label: 'Arundhatī and Vasiṣṭha', node: 'claim-oak-ahead' }, { label: 'Brahmarāśi and Vega', node: 'claim-oak-vega' }, { label: 'A disputed eclipse reading', node: 'research-eclipse' }, { label: 'The illustrative sky investigation', href: '/arundhati/' }] },
    { label: 'Sources and methods', entries: [{ label: 'The BORI Critical Edition', node: 'source-bori' }, { label: 'The Baroda Critical Edition', node: 'source-baroda' }, { label: 'Hastināpura’s excavated layers', node: 'research-hastinapura' }, { label: 'The Rakhigarhi sample', node: 'research-rakhigarhi' }, { label: 'Research notebook', href: '/research/' }] },
  ] },
];

export const branchFor = (id: string) => branches.find((branch) => branch.id === id);
export const branchHref = (id: string) => `/map/${id}/`;
export const mapReadingHref = (node: string) => `/map/reading/${node}/`;
