import { env } from "../config/env";

export interface CvAnalysis {
  skills: string[];
  yearsOfExperience: number;
  summary: string;
}

export interface AdaptedCv {
  adaptedText: string;
  highlightedSkills: string[];
}

export interface CoverLetter {
  text: string;
}

export const openaiService = {
  async analyzeCv(cvText: string): Promise<CvAnalysis> {
    void cvText;
    void env.openaiApiKey;
    return {
      skills: [],
      yearsOfExperience: 0,
      summary: "stub: OpenAI integration not yet wired",
    };
  },

  async adaptCv(cvText: string, jobDescription: string): Promise<AdaptedCv> {
    void cvText;
    void jobDescription;
    return {
      adaptedText: "stub: CV adaptation not yet wired",
      highlightedSkills: [],
    };
  },

  async generateCoverLetter(
    cvText: string,
    jobDescription: string,
    tone: string = "professional",
  ): Promise<CoverLetter> {
    void cvText;
    void jobDescription;
    void tone;
    return {
      text: "stub: cover letter generation not yet wired",
    };
  },
};
