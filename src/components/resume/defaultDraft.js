export const RESUME_TEMPLATE_IDS = {
  ATS: "standard_ats",
  IIITV: "iiitv_latex_style",
};

export function createBlankResumeDraft() {
  return {
    templateId: RESUME_TEMPLATE_IDS.ATS,
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      summary: "",
    },
    education: [],
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: [],
  };
}
