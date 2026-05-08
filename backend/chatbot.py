import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_ai_response(user_message, history=[], memories=[]):
    memory_text = "\n".join(memories)

    messages = [
        {
            "role": "system",
            "content": (
                "You are VaaniAI, a smart and friendly AI voice assistant. "
                "Use the user's saved memories when helpful. "
                f"Saved user memories:\n{memory_text}"
            ),
        }
    ]

    for item in history:
        messages.append({"role": "user", "content": item["user"]})
        messages.append({"role": "assistant", "content": item["ai"]})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
    )

    return response.choices[0].message.content