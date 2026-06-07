export interface JDInputs {
  title: string;
  department: string;
  responsibilities: string;
  qualifications: string;
  tone: string;
}

export async function generateJobDescription(inputs: JDInputs, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("Groq API Key is not configured. Please add it first.");
  }

  const systemContent = `You are an expert HR Recruiter. Generate a professional and inclusive Job Description based on the user's inputs.
Strict requirements:
1. Do NOT contain age, gender, marital status, nationality, religion, ethnicity, or other protected-characteristic preferences.
2. Follow the EXACT structure below. Do not use markdown backticks like \`\`\`. Write the headings as level 2 Markdown headings (e.g., ## Job Summary):

## Job Summary
[Provide a brief overview of the role and its business purpose based on the inputs]

## Key Responsibilities
[Provide 5-8 bullet points describing major duties]

## Required Qualifications
[Provide education, experience, certifications, and core requirements]

## Preferred Skills
[Provide nice-to-have skills and competencies]

## Benefits & Working Environment
[Provide company benefits, development opportunities, and work conditions]

3. Include the following Equal Opportunity Statement EXACTLY as written at the very end of the text as a separate paragraph (do not translate, truncate, or paraphrase it):
"We are an equal opportunity employer and welcome applications from all qualified candidates regardless of race, color, religion, sex, gender identity, sexual orientation, national origin, age, disability, or any other protected characteristic."

Ensure sections are populated with realistic professional sentences if inputs are brief.`;

  const userContent = `Job Title: ${inputs.title}
Department: ${inputs.department}
Key Responsibilities: ${inputs.responsibilities}
Required Qualifications: ${inputs.qualifications}
Tone: ${inputs.tone}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errText || "Request failed"}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq.");
    }

    return content;
  } catch (error: any) {
    console.error("Error generating JD:", error);
    throw new Error(error?.message || "Generation failed. Please try again.");
  }
}
