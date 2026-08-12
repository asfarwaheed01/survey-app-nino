export type Lang = "en" | "ka";

export type InputType = "single_choice" | "multiple_choice" | "free_text";

export interface QuestionMeta {
  inputType: InputType;
  options: string[];
  topic: string;
  shouldContinue: boolean;
}

export interface Profile {
  communication_style: string;
  strengths: string[];
  decision_style: string;
  motivations: string[];
  recommendations: string[];
}

// Answer the client already knows about (client passes the question + topic it
// is responding to, so the server doesn't need to keep pending-question state).
export interface AnswerInput {
  question: string;
  answer: string;
  topic: string;
}

// SSE events sent from /api/message to the client.
export type StreamEvent =
  | { type: "token"; v: string } // one chunk of the question text
  | { type: "meta"; meta: QuestionMeta } // structured reply options
  | { type: "profile"; profile: Profile } // final generated profile
  | { type: "progress"; step: number; total: number }
  | { type: "error"; message: string }
  | { type: "done" };
