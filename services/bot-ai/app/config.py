import os

DIFFICULTY_DEFAULT = os.getenv("BOT_DIFFICULTY_DEFAULT", "NORMAL")
LLM_ENABLED = os.getenv("LLM_ENABLED", "false").lower() in ("1", "true", "yes")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
