export interface Disease {
  name: string;
  symptoms: string[];
  description: string;
  severity: "mild" | "moderate" | "severe";
  recommendations: string[];
}

export const DISEASE_DATABASE: Disease[] = [
  {
    name: "Common Cold",
    symptoms: ["runny nose", "sneezing", "sore throat", "mild cough", "congestion", "mild fever", "fatigue"],
    description: "A viral infection of the upper respiratory tract.",
    severity: "mild",
    recommendations: ["Rest", "Stay hydrated", "Over-the-counter decongestants", "Throat lozenges"],
  },
  {
    name: "Influenza (Flu)",
    symptoms: ["high fever", "chills", "body aches", "muscle pain", "severe fatigue", "headache", "dry cough", "sore throat"],
    description: "A contagious respiratory illness caused by influenza viruses.",
    severity: "moderate",
    recommendations: ["Bed rest", "Plenty of fluids", "Antiviral medications (consult doctor)", "Pain relievers for fever"],
  },
  {
    name: "COVID-19",
    symptoms: ["fever", "dry cough", "shortness of breath", "loss of taste", "loss of smell", "fatigue", "body aches", "headache"],
    description: "A respiratory illness caused by the SARS-CoV-2 virus.",
    severity: "moderate",
    recommendations: ["Isolate immediately", "Consult healthcare provider", "Monitor oxygen levels", "Stay hydrated"],
  },
  {
    name: "Strep Throat",
    symptoms: ["severe sore throat", "difficulty swallowing", "fever", "swollen lymph nodes", "red tonsils", "white patches on throat"],
    description: "A bacterial infection causing throat inflammation.",
    severity: "moderate",
    recommendations: ["See a doctor for antibiotics", "Gargle with warm salt water", "Rest", "Avoid cold drinks"],
  },
  {
    name: "Pneumonia",
    symptoms: ["chest pain", "cough with mucus", "high fever", "shortness of breath", "chills", "sweating", "fatigue"],
    description: "Infection causing inflammation in the air sacs in one or both lungs.",
    severity: "severe",
    recommendations: ["Seek medical attention immediately", "Antibiotics as prescribed", "Hospitalization may be required", "Oxygen therapy if needed"],
  },
  {
    name: "Gastroenteritis",
    symptoms: ["nausea", "vomiting", "diarrhea", "stomach cramps", "abdominal pain", "mild fever", "dehydration"],
    description: "Inflammation of the gastrointestinal tract, often caused by viruses or bacteria.",
    severity: "mild",
    recommendations: ["Stay hydrated with clear fluids", "BRAT diet (bananas, rice, applesauce, toast)", "Rest", "Oral rehydration salts"],
  },
  {
    name: "Urinary Tract Infection (UTI)",
    symptoms: ["burning urination", "frequent urination", "cloudy urine", "pelvic pain", "strong urine odor", "blood in urine"],
    description: "Infection in any part of the urinary system.",
    severity: "moderate",
    recommendations: ["See a doctor for antibiotics", "Drink plenty of water", "Avoid irritants like caffeine", "Urinate frequently"],
  },
  {
    name: "Migraine",
    symptoms: ["severe headache", "throbbing pain", "nausea", "vomiting", "light sensitivity", "sound sensitivity", "aura", "vision changes"],
    description: "A neurological condition causing intense, debilitating headaches.",
    severity: "moderate",
    recommendations: ["Rest in a dark, quiet room", "Pain relievers", "Triptans (consult doctor)", "Cold compress on forehead"],
  },
  {
    name: "Allergic Rhinitis",
    symptoms: ["sneezing", "runny nose", "itchy eyes", "watery eyes", "nasal congestion", "itchy throat", "postnasal drip"],
    description: "An allergic response causing inflammation in the nasal passages.",
    severity: "mild",
    recommendations: ["Antihistamines", "Avoid allergens", "Nasal sprays", "Keep windows closed during high pollen seasons"],
  },
  {
    name: "Asthma",
    symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing at night", "difficulty breathing", "rapid breathing"],
    description: "A condition in which airways narrow and swell, producing extra mucus.",
    severity: "moderate",
    recommendations: ["Use prescribed inhaler", "Avoid triggers", "See a pulmonologist", "Follow asthma action plan"],
  },
  {
    name: "Hypertension",
    symptoms: ["headache", "dizziness", "blurred vision", "chest pain", "shortness of breath", "nosebleeds", "flushing"],
    description: "A condition in which the force of blood against artery walls is too high.",
    severity: "severe",
    recommendations: ["Monitor blood pressure regularly", "Reduce salt intake", "Exercise", "Consult a cardiologist", "Medication if prescribed"],
  },
  {
    name: "Type 2 Diabetes",
    symptoms: ["increased thirst", "frequent urination", "fatigue", "blurred vision", "slow healing wounds", "tingling hands", "weight loss"],
    description: "A chronic condition that affects the way the body processes blood sugar.",
    severity: "severe",
    recommendations: ["Monitor blood sugar levels", "Dietary changes", "Regular exercise", "Consult an endocrinologist", "Medication as prescribed"],
  },
  {
    name: "Appendicitis",
    symptoms: ["severe abdominal pain", "pain around navel moving to lower right", "nausea", "vomiting", "fever", "loss of appetite", "rebound tenderness"],
    description: "Inflammation of the appendix, a medical emergency.",
    severity: "severe",
    recommendations: ["Go to emergency room immediately", "Do not eat or drink", "Surgery typically required"],
  },
  {
    name: "Acid Reflux / GERD",
    symptoms: ["heartburn", "chest burning", "regurgitation", "difficulty swallowing", "chronic cough", "sour taste in mouth"],
    description: "A digestive disorder where stomach acid flows back into the esophagus.",
    severity: "mild",
    recommendations: ["Avoid trigger foods", "Eat smaller meals", "Don't lie down after eating", "Antacids or PPIs as prescribed"],
  },
  {
    name: "Chickenpox",
    symptoms: ["itchy rash", "red spots", "blisters", "fever", "fatigue", "loss of appetite", "headache"],
    description: "A highly contagious viral infection causing an itchy blister-like rash.",
    severity: "mild",
    recommendations: ["Isolate to prevent spread", "Calamine lotion for itching", "Antihistamines", "Avoid scratching blisters"],
  },
  {
    name: "Dengue Fever",
    symptoms: ["high fever", "severe headache", "pain behind eyes", "joint pain", "muscle pain", "rash", "mild bleeding", "fatigue"],
    description: "A mosquito-borne tropical disease caused by dengue viruses.",
    severity: "severe",
    recommendations: ["Seek immediate medical care", "Stay hydrated", "Monitor platelet count", "Pain relievers (avoid aspirin/ibuprofen)"],
  },
  {
    name: "Conjunctivitis (Pink Eye)",
    symptoms: ["red eyes", "eye discharge", "itchy eyes", "watery eyes", "swollen eyelids", "crusty eyelashes in morning"],
    description: "Inflammation or infection of the outer membrane of the eyeball.",
    severity: "mild",
    recommendations: ["Antibiotic eye drops if bacterial", "Warm compress", "Avoid touching eyes", "Wash hands frequently"],
  },
  {
    name: "Anemia",
    symptoms: ["fatigue", "weakness", "pale skin", "shortness of breath", "dizziness", "cold hands and feet", "brittle nails", "headache"],
    description: "A condition where you lack enough healthy red blood cells to carry adequate oxygen to tissues.",
    severity: "moderate",
    recommendations: ["Iron-rich diet", "Iron supplements if prescribed", "Vitamin B12 supplements", "Consult a hematologist"],
  },
];

export function matchDiseases(symptoms: string[]): Array<{ disease: Disease; matchScore: number }> {
  const normalizedInput = symptoms.map((s) => s.toLowerCase().trim());

  const results = DISEASE_DATABASE.map((disease) => {
    const diseaseSymptoms = disease.symptoms.map((s) => s.toLowerCase());
    let matchCount = 0;

    for (const inputSymptom of normalizedInput) {
      for (const diseaseSymptom of diseaseSymptoms) {
        if (
          diseaseSymptom.includes(inputSymptom) ||
          inputSymptom.includes(diseaseSymptom) ||
          levenshteinSimilarity(inputSymptom, diseaseSymptom) > 0.75
        ) {
          matchCount++;
          break;
        }
      }
    }

    const matchScore = normalizedInput.length > 0 ? matchCount / normalizedInput.length : 0;
    return { disease, matchScore };
  });

  return results
    .filter((r) => r.matchScore > 0.1)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

function levenshteinSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}
