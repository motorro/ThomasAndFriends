# Thomas and friends

The demo is built using the [Firebase-AI-Chat](https://github.com/motorro/firebase-ai-chat) and was a part of the 
Gemini AI Contest 2024.

This repository is created for the demo purposes and for the historical reasons.

The application uses some proprietary services for the flight booking. These parts were removed and the exception is 
thrown whenever the tools access it. Write your own adapter if you want to test.

## Description
This is a demo of several assistants working as a team to dispatch the client service requests.
Each assistant specializes on some part of the ordering process:

- [Thomas the Engine](Firebase/functions/src/assistants/Thomas.ts). He is a front desk manager. He is the first to meet 
  the client and categorize the request.
- [Emerson](Firebase/functions/src/assistants/Flight.ts). He is in charge of the flight booking. 
  Where from, where to, departure, etc
- [Topham Hatt](Firebase/functions/src/assistants/Catering.ts). He is in charge of catering arrangement.
- [Ace](Firebase/functions/src/assistants/Transfer.ts). In charge of airport transfer.

Thomas starts the discussion and hands over the chat to the appropriate teammate to fix the exact details.
The team works to build a common [order data](Firebase/functions/src/data/OrderChatData.ts) each of them contributing to 
their own order part by calling functions defined in its own scope.
Overall the pattern is similar to [Crew AI](https://www.crewai.com/) or [LangChain](https://www.langchain.com/) agentic flows 
and allows to narrow down the assistant instructions and to better focus each assistant.

Take a look at the [video](https://www.youtube.com/watch?v=az01AnARl10) that demonstrates the complete flow of booking a charter

## Copyright

[Thomas and Friends series](https://en.wikipedia.org/wiki/Thomas_%26_Friends): Mattel and Awdry Family
