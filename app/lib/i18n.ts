import type { Lang } from "@/app/types/index";

type Dict = Record<string, string>;

const en: Dict = {
  heroTitle: "Discover your personality in 5 minutes",
  heroSub: "An AI-powered personality test that reveals your unique traits",
  emailPlaceholder: "Enter your email",
  activateMic: "Activate microphone",
  micActive: "Microphone ready",
  micDenied: "Mic permission denied",
  start: "Start",
  meta: "~ 8 minutes · text based",
  invalidEmail: "Please enter a valid email address.",
  starting: "Starting…",
  typeResponse: "Type your response…",
  send: "Send",
  submit: "Submit",
  chooseMany: "Pick any that fit",
  switchToVoice: "Switch to voice",
  voiceSoon: "Voice mode is coming soon.",
  analyzing: "Reading your answers and shaping your profile…",
  profileTitle: "Your personality profile",
  communication: "Communication style",
  strengths: "Strengths",
  decision: "Decision-making",
  motivations: "What drives you",
  recommendations: "Recommendations",
  profileOutro: "Want deeper insights and future surveys tailored to you?",
  register: "Create my account",
  restart: "Start over",
  errorGeneric: "Something went wrong. Please try again.",
  typeOwnAnswer: "Type my own answer instead",
};

const ka: Dict = {
  heroTitle: "აღმოაჩინე შენი პიროვნება 5 წუთში",
  heroSub:
    "AI-ზე დაფუძნებული ტესტი, რომელიც შენს უნიკალურ თვისებებს გამოავლენს",
  emailPlaceholder: "შეიყვანე ელფოსტა",
  activateMic: "მიკროფონის გააქტიურება",
  micActive: "მიკროფონი მზადაა",
  micDenied: "მიკროფონზე წვდომა უარყოფილია",
  start: "დაწყება",
  meta: "~ 8 წუთი · ხმით ან ტექსტით",
  invalidEmail: "გთხოვ, შეიყვანე სწორი ელფოსტა.",
  starting: "იწყება…",
  typeResponse: "დაწერე პასუხი…",
  send: "გაგზავნა",
  submit: "დადასტურება",
  chooseMany: "აირჩიე ყველა შესაფერისი",
  switchToVoice: "ხმაზე გადართვა",
  voiceSoon: "ხმოვანი რეჟიმი მალე დაემატება.",
  analyzing: "ვკითხულობ პასუხებს და ვქმნი შენს პროფილს…",
  profileTitle: "შენი პიროვნული პროფილი",
  communication: "კომუნიკაციის სტილი",
  strengths: "ძლიერი მხარეები",
  decision: "გადაწყვეტილების მიღება",
  motivations: "რა გამოძრავებს",
  recommendations: "რეკომენდაციები",
  profileOutro: "გინდა უფრო ღრმა ანალიზი და შენზე მორგებული კვლევები?",
  register: "ანგარიშის შექმნა",
  restart: "თავიდან დაწყება",
  errorGeneric: "რაღაც ვერ მოხერხდა. სცადე თავიდან.",
  typeOwnAnswer: "საკუთარი პასუხის ჩაწერა",
};

const dicts: Record<Lang, Dict> = { en, ka };

export function t(lang: Lang, key: keyof typeof en): string {
  return dicts[lang][key] ?? en[key] ?? key;
}
