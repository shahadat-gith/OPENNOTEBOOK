/**
 * Canned, grounded answers used by the mock API while there is no backend.
 * Each answer matches a set of keywords; the API also returns a fallback.
 * Replace this whole module with real LLM calls once the backend exists.
 */

export const mockAnswers = [
  {
    keywords: ["self-attention", "attention", "transformer"],
    content:
      "Self-attention lets every token in a sequence look at every other token and decide how much attention to pay to each one [[citation:1]]. In the Transformer, each token produces a query, a key, and a value vector; the query of one token is matched against the keys of all the others to compute weights, and the output is a weighted sum of the values.\n\nThe authors call this **Scaled Dot-Product Attention**, and they run it multiple times in parallel — **Multi-Head Attention** — so the model can attend to information from different representation subspaces at different positions [[citation:2]].",
    sourceIds: ["src-transformer"],
    citations: [
      {
        id: "ans-cit-1",
        index: 1,
        sourceId: "src-transformer",
        sourceName: "Attention Is All You Need",
        quote:
          "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors.",
        page: 3,
        relevance: 0.96,
      },
      {
        id: "ans-cit-2",
        index: 2,
        sourceId: "src-transformer",
        sourceName: "Attention Is All You Need",
        quote:
          "we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections… These are concatenated and once again projected.",
        page: 4,
        relevance: 0.9,
      },
    ],
  },
  {
    keywords: ["rag", "retrieval", "generation"],
    content:
      "RAG combines a retrieval system with a generative model: instead of answering from memory alone, the model first retrieves relevant passages from your uploaded documents, then generates an answer grounded in those passages [[citation:1]]. This cuts hallucinations and lets the model answer questions about content it never saw in training [[citation:2]].\n\nThe pipeline is: parse and chunk documents, embed the chunks into a vector index, then at query time retrieve the most similar chunks and generate an answer grounded in them.",
    sourceIds: ["src-rag"],
    citations: [
      {
        id: "ans-cit-3",
        index: 1,
        sourceId: "src-rag",
        sourceName: "RAG Explained: Retrieval-Augmented Generation",
        quote:
          "the model first retrieves relevant passages from a knowledge base — your uploaded documents — and then generates an answer grounded in those passages.",
        page: 1,
        relevance: 0.96,
      },
      {
        id: "ans-cit-4",
        index: 2,
        sourceId: "src-rag",
        sourceName: "RAG Explained: Retrieval-Augmented Generation",
        quote:
          "This reduces hallucinations and lets the model answer questions about content it has never seen during training.",
        page: 1,
        relevance: 0.89,
      },
    ],
  },
  {
    keywords: ["luck", "risk", "wealth", "psychology of money"],
    content:
      "Morgan Housel treats luck and risk as the twin forces behind every financial outcome, and argues that the line between them is fuzzier than we like to admit [[citation:1]]. That's why he warns against copying the strategy of any single success story — you can't tell how much of that outcome was skill and how much was luck.\n\nHe pairs this with a second idea: **getting wealthy and staying wealthy are different skills** [[citation:2]]. The best way to benefit from luck is to survive long enough for compounding to do its work.",
    sourceIds: ["src-money"],
    citations: [
      {
        id: "ans-cit-5",
        index: 1,
        sourceId: "src-money",
        sourceName: "The Psychology of Money",
        quote:
          "Luck and risk are both reality. They are the twin forces that weave the story of every financial outcome.",
        page: 1,
        relevance: 0.97,
      },
      {
        id: "ans-cit-6",
        index: 2,
        sourceId: "src-money",
        sourceName: "The Psychology of Money",
        quote: "Getting money is one thing. Keeping it is another.",
        page: 2,
        relevance: 0.92,
      },
    ],
  },
  {
    keywords: ["compound", "compounding", "buffett"],
    content:
      "Because it turns small, boring, consistent actions into enormous results over time [[citation:1]]. Housel's example is Warren Buffett: roughly $80 billion of his fortune was earned after his 65th birthday, not because he outsmarted everyone, but because he started investing at ten and never stopped — time in the market did the heavy lifting.\n\nThe practical takeaway: give your strategy enough time, and small edges become huge. There's no good reason to risk what you have and need for what you don't have and don't need [[citation:2]].",
    sourceIds: ["src-money", "src-investopedia"],
    citations: [
      {
        id: "ans-cit-7",
        index: 1,
        sourceId: "src-money",
        sourceName: "The Psychology of Money",
        quote: "The most powerful force in investing is compounding.",
        page: 3,
        relevance: 0.95,
      },
      {
        id: "ans-cit-8",
        index: 2,
        sourceId: "src-money",
        sourceName: "The Psychology of Money",
        quote:
          "There is no good reason to risk what you have and need for what you don't have and don't need.",
        page: 2,
        relevance: 0.88,
      },
    ],
  },
  {
    keywords: ["habit", "atomic"],
    content:
      "Habits are the **compound interest of self-improvement**: the same way money multiplies through compound interest, the effects of your habits multiply as you repeat them [[citation:1]]. Improving by just 1 percent isn't noticeable on any given day, but over months and years the difference is astounding [[citation:2]].\n\nThe practical implication is that you should focus on systems rather than goals — small, consistent behaviors that compound into identity-level change.",
    sourceIds: ["src-atomic"],
    citations: [
      {
        id: "ans-cit-9",
        index: 1,
        sourceId: "src-atomic",
        sourceName: "Atomic Habits",
        quote:
          "Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.",
        page: 1,
        relevance: 0.96,
      },
      {
        id: "ans-cit-10",
        index: 2,
        sourceId: "src-atomic",
        sourceName: "Atomic Habits",
        quote:
          "Improving by just 1 percent isn't particularly notable — sometimes it isn't even noticeable — but it can be far more meaningful in the long run.",
        page: 2,
        relevance: 0.91,
      },
    ],
  },
  {
    keywords: ["deep work", "focus", "interrupt", "distraction"],
    content:
      "Newport's answer starts with a definition: deep work is the ability to focus without distraction on a cognitively demanding task — and that ability is exactly what constant interruptions erode [[citation:1]]. He suggests scheduling deep work blocks like meetings with yourself and ruthlessly protecting them, and accepting that in an age of always-on, shallow work the ability to go deep is rare — and therefore valuable [[citation:2]].",
    sourceIds: ["src-deepwork"],
    citations: [
      {
        id: "ans-cit-11",
        index: 1,
        sourceId: "src-deepwork",
        sourceName: "Deep Work",
        quote:
          "Deep work is the ability to focus without distraction on a cognitively demanding task.",
        page: 1,
        relevance: 0.95,
      },
      {
        id: "ans-cit-12",
        index: 2,
        sourceId: "src-deepwork",
        sourceName: "Deep Work",
        quote:
          "the ability to go deep is becoming increasingly rare and increasingly valuable.",
        page: 2,
        relevance: 0.9,
      },
    ],
  },
]
