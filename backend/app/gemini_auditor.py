"""
Gemini AI Auditor
=================
Secondary verification of warehouse bag counts using Gemini Vision.
Reads GEMINI_API_KEY from environment. Gracefully disabled if key is absent.
"""

import os
import json
import re
from dotenv import load_dotenv

# v14.88: Load local environment variables from .env
load_dotenv()


class GeminiAuditor:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model = None
        self.enabled = False

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)

                # Fetch models actually available for this key
                try:
                    all_models = list(genai.list_models())
                    self.available_models = [
                        m.name for m in all_models
                        if "generateContent" in m.supported_generation_methods
                    ]
                    print(f"GeminiAuditor: {len(self.available_models)} models found.")
                    print("GeminiAuditor: Available models: " + ", ".join(self.available_models))
                except Exception as list_err:
                    print(f"GeminiAuditor: list_models() failed ({list_err})")
                    self.available_models = []

                # v14.92: Smart selection from the actual available list
                target = None
                if self.available_models:
                    # Prefer flash, then pro, then anything else
                    for m_name in self.available_models:
                        if "gemini-1.5-flash" in m_name:
                            target = m_name
                            break
                    if not target:
                        for m_name in self.available_models:
                            if "gemini" in m_name and "embedding" not in m_name:
                                target = m_name
                                break
                
                if not target:
                    target = "gemini-1.5-flash" # Absolute fallback
                
                self.model = genai.GenerativeModel(target)
                self.enabled = True
                print(f"GeminiAuditor: Selected ({target})")

            except Exception as e:
                print(f"GeminiAuditor: Init failed — {e}")
        else:
            print("GeminiAuditor: No GEMINI_API_KEY found. AI audit disabled.")

    def audit_count(self, image_path: str, visible_count: int, depth_layers: int, predicted_total: int) -> dict:
        """
        Send the original warehouse image to Gemini for an independent audit.
        v14.91: Includes live failover to handle 404/deprecated model errors.
        """
        if not self.enabled:
            return {"audited_count": predicted_total, "reasoning": None, "audit_available": False}

        # v14.93: Dynamically build candidates from actually available models
        candidates = [m for m in (getattr(self, 'available_models', []) or []) if 'gemini' in m and 'embedding' not in m]
        
        # Hardcoded fallbacks if discovery failed
        if not candidates:
            candidates = ["models/gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-pro-vision"]
        
        # Ensure the 'detected' target is first
        if self.model and self.model.model_name not in candidates:
            candidates.insert(0, self.model.model_name)
        elif self.model:
            candidates.remove(self.model.model_name)
            candidates.insert(0, self.model.model_name)

        from PIL import Image as PILImage
        try:
            pil_img = PILImage.open(image_path)
        except Exception as e:
            print(f"GeminiAuditor: Failed to load image — {e}")
            return {"audited_count": predicted_total, "reasoning": None, "audit_available": False}

        prompt = (
            "You are an expert warehouse inventory auditor specialising in jute/cardboard bag stacks.\n\n"
            "My YOLO detection system has already analysed this image and found:\n"
            f"  • Visible bags detected : {visible_count}\n"
            f"  • Estimated stack depth : {depth_layers} layers\n"
            f"  • YOLO predicted total  : {predicted_total}\n\n"
            "Please examine the image carefully and provide ALL of the following:\n\n"
            "1. visible_rows   — count the distinct horizontal rows of bags you can see on the front face\n"
            "2. visible_cols   — count the distinct vertical columns of bags on the front face\n"
            "3. estimated_depth — how many bags deep is the stack (hidden layers behind the front face);\n"
            "   judge this from perspective, diminishing bag sizes, shadows, or side-view clues\n"
            "4. volume_formula — write the calculation as a short string, e.g. '18 rows × 24 cols × 3 depth = 1296 × 0.94 ≈ 1218'\n"
            "5. audited_count  — your final integer estimate for the TOTAL bag count\n"
            "6. reasoning      — a detailed 3-4 sentence explanation covering:\n"
            "   (a) what you observe in the image (stack layout, arrangement, visible face)\n"
            "   (b) how you determined rows, columns, and depth\n"
            "   (c) any adjustments for packing efficiency or irregular stacking\n\n"
            "IMPORTANT: Do not mention any brand names, labels, or text found on the boxes (e.g. 'Moong Dal', 'Hatsun', etc.). Focus only on the physical dimensions and stacking pattern.\n\n"
            "Respond ONLY with valid JSON — no markdown fences, no extra text:\n"
            '{"audited_count":<int>,"visible_rows":<int>,"visible_cols":<int>,'
            '"estimated_depth":<int>,"volume_formula":"<string>","reasoning":"<string>"}'
        )

        last_error = None
        for model_name in candidates:
            try:
                import google.generativeai as genai
                current_model = genai.GenerativeModel(model_name)
                response = current_model.generate_content([pil_img, prompt])
                raw = response.text.strip()

                # Strip markdown code fences if Gemini wraps the JSON
                raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.IGNORECASE)
                raw = re.sub(r'\s*```$', '', raw)

                m = re.search(r'\{.*?"audited_count".*?\}', raw, re.DOTALL)
                if m:
                    data = json.loads(m.group())
                    self.model = current_model  # lock working model for future calls
                    return {
                        "audited_count":    max(0, int(data.get("audited_count", predicted_total))),
                        "visible_rows":     int(data.get("visible_rows", 0)),
                        "visible_cols":     int(data.get("visible_cols", 0)),
                        "estimated_depth":  int(data.get("estimated_depth", depth_layers)),
                        "volume_formula":   str(data.get("volume_formula", "")).strip(),
                        "reasoning":        str(data.get("reasoning", "")).strip(),
                        "audit_available":  True,
                    }

                # Gemini returned plain text — use as reasoning, keep YOLO count
                return {
                    "audited_count": predicted_total, "visible_rows": 0, "visible_cols": 0,
                    "estimated_depth": depth_layers, "volume_formula": "",
                    "reasoning": raw[:800], "audit_available": True,
                }

            except Exception as e:
                last_error = str(e)
                if "404" in last_error or "not found" in last_error.lower() or "available" in last_error.lower():
                    print(f"GeminiAuditor: {model_name} → 404, trying next...")
                    continue
                print(f"GeminiAuditor: Audit failed — {e}")
                break

        return {
            "audited_count": predicted_total, "visible_rows": 0, "visible_cols": 0,
            "estimated_depth": depth_layers, "volume_formula": "",
            "reasoning": None, "audit_available": False,
        }
