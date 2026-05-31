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
            "You are VaaniAI, a smart, friendly, and conversational AI voice assistant. "
            "Keep responses short, natural, and easy to listen to by default. "
            "Answer in 1-3 sentences for most questions. "
            "Only provide detailed explanations when the user explicitly asks for more details, examples, step-by-step guidance, or an in-depth explanation. "
            "Avoid sounding like a textbook. "
            "Use the user's saved memories when helpful. "
            f"Saved user memories:\n{memory_text}"
        ),
    }
]
    for item in history[-10:]:
        messages.append({"role": "user", "content": item["user"]})
        messages.append({"role": "assistant", "content": item["ai"]})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=200,
        temperature=0.7,
    )

    return response.choices[0].message.content