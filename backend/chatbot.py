import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_ai_response(user_message, history=None, memories=None):
    if history is None:
        history = []

    if memories is None:
        memories = []

    # Don't use personal memories for general knowledge questions
    general_questions = [
        "what is",
        "define",
        "python",
        "java",
        "sql",
        "dbms",
        "oops",
        "ai",
        "machine learning",
        "data structure",
        "algorithm",
        "operating system",
        "computer network"
    ]

    use_memories = not any(
        term in user_message.lower()
        for term in general_questions
    )

    # Filter memories
    filtered_memories = []

    for memory in memories:
        if isinstance(memory, str):
            filtered_memories.append(memory)

    memory_text = "\n".join(filtered_memories) if use_memories else ""

    messages = [
        {
            "role": "system",
            "content": (
                "You are VaaniAI, a smart, friendly, voice-first AI assistant. "
                "Keep responses concise, natural, and conversational. "
                "For normal questions, answer in 1-2 sentences. "
                "If the user asks for details, explain in 4-6 sentences maximum. "
                "Do not give textbook-style answers, long bullet lists, code blocks, or lengthy explanations unless explicitly requested. "
                "Speak naturally like a helpful human assistant. "

                "Never start a response with the user's name. "
                "Do not address the user by name in every response. "
                "Use the user's name only when greeting them or when they specifically ask for personalization. "

                "For factual questions such as Python, Java, SQL, DBMS, AI, programming concepts, interview questions, or technical topics, answer directly without mentioning personal information. "

                "Use saved memories ONLY when directly relevant to the user's question. "
                "Ignore memories for general knowledge questions."
            ),
        }
    ]

    # Add memories separately
    if memory_text:
        messages.append(
            {
                "role": "system",
                "content": (
                    "User memories (use only if directly relevant):\n"
                    f"{memory_text}"
                ),
            }
        )

    # Last 10 chat exchanges only
    for item in history[-10:]:
        if (
            isinstance(item, dict)
            and "user" in item
            and "ai" in item
        ):
            messages.append(
                {
                    "role": "user",
                    "content": item["user"]
                }
            )

            messages.append(
                {
                    "role": "assistant",
                    "content": item["ai"]
                }
            )

    # Current user message
    messages.append(
        {
            "role": "user",
            "content": user_message
        }
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.5,
        max_tokens=100,
    )

    return response.choices[0].message.content.strip()