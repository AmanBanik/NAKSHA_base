import os
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

chat_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-01"
)

try:
    response = chat_client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o"),
        messages=[
            {"role": "system", "content": "You are a test bot."},
            {"role": "user", "content": "Hello"}
        ],
        temperature=0.2
    )
    print("SUCCESS!")
    print(response.choices[0].message.content)
except Exception as e:
    print("ERROR OCCURRED:")
    print(str(e))
