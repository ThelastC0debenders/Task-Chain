import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[LLM] ❌ ERROR: GEMINI_API_KEY not found!")
            raise ValueError("Missing GEMINI_API_KEY")

        # Initialize the client
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-flash"  # Updated to valid model
        
        print(f"[LLM] 🤖 Gemini Client initialized using {self.model_id}")
    
    # ✅ FIX: Proper indentation - must be inside the class!
    def generate(self, prompt: str, system_instruction: str = None):
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                )
            )
            
            
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                
                if hasattr(candidate, 'content'):
                    # print(f"[DEBUG] Content: {candidate.content}")
                    if hasattr(candidate.content, 'parts'):
                        if candidate.content.parts:
                            text = candidate.content.parts[0].text
                            # print(f"[DEBUG] Extracted text: {text[:100]}...")
                            return text
            
            print("[DEBUG] Failed to extract text from response")
            return "⚠️ Could not extract text from response"
            
        except Exception as e:
            print(f"[LLM ERROR] {e}")
            import traceback
            traceback.print_exc()
            return f"Error: {str(e)}"