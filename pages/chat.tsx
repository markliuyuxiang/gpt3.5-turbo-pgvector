import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import { ReactNode, useState } from "react";

import { Toaster, toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import LoadingDots from "@/components/LoadingDots";
import ResizablePanel from "@/components/ResizablePanel";
import MetaTags from "@/components/MetaTags";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import generateAnswer from "@/utils/generateAnswer";


import { PageMeta } from "../types";

interface Props {
  children: ReactNode;
  meta?: PageMeta;
}

const ChatPage: NextPage<Props> = ({ children, meta: pageMeta }: Props) => {
  const [loading, setLoading] = useState(false);
  const [userQ, setUserQ] = useState("");
  const [answer, setAanswer] = useState("");

  console.log("Streamed response: ", answer);

  const question = userQ;

  const generateAnswer = async (e: any) => {
    e.preventDefault();
    if (!userQ) {
      return toast.error("Please enter a question!");
    }

    setAanswer("");
    setLoading(true);
    const response = await fetch("/api/docs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question
      })
    });
    console.log("Edge function returned.");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setAanswer((prev) => prev + chunkValue);
    }

    setLoading(false);
  };

  return (
    <>
      <MetaTags
        title="Webdev Answerbot"
        description="Web Developer answer-bot trained on Supabase, Nextjs, React, TailwindCSS."
        cardImage="/bot/docs-og.png"
        url=""
      />
      <main className="flex flex-col items-center justify-center min-h-screen py-2 mx-auto text-center">
        <div className="flex-grow border-2 border-blue-500">
          <h1 className="max-w-xl text-2xl font-bold sm:text-4xl">
            Ask me anything<sup>*</sup> about web development!
          </h1>
        </div>
        <div className="w-full max-w-xl border-2 border-red-500">
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />
          <ResizablePanel>
            <AnimatePresence mode="wait">
              <motion.div className="my-10 space-y-10">
                {answer && (
                  <div
                    className="max-w-xl p-4 overflow-x-auto text-left transition border shadow-md bg-neutral border-neutral-focus rounded-xl hover:border-accent-focus cursor-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(answer);
                      toast("Copied to clipboard!", {
                        icon: "✂️"
                      });
                    }}
                  >
                    {answer.includes("SOURCES:") ? (
                      <>
                        <MarkdownRenderer
                          content={answer.split("SOURCES:")[0].trim()}
                        />

                        <p>SOURCES:</p>
                        <ul>
                          {answer
                            .split("SOURCES:")[1]
                            .trim()
                            .split("\n")
                            .filter((url) => url.trim().length > 0)
                            .map((url) =>
                              url.includes("http") ? (
                                <li key={uuidv4()}>
                                  <a
                                    className="underline text-accent"
                                    target="_blank"
                                    href={url.replace(/^-+/g, "")} // Remove leading hyphens
                                  >
                                    {url.replace(/^-+/g, "")}
                                  </a>
                                </li>
                              ) : (
                                <li key={uuidv4()}>{url}</li>
                              )
                            )}
                        </ul>
                      </>
                    ) : (
                      <MarkdownRenderer content={answer.trim()} />
                    )}
                    <style>{`p { margin-bottom: 20px; }`}</style>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </ResizablePanel>
        </div>
        <div className="flex items-center w-full max-w-xl border-2 border-green-500">
          <textarea
            value={userQ}
            onChange={(e) => setUserQ(e.target.value)}
            rows={1}
            className="w-full p-2 mr-5 border rounded-md shadow-md bg-neutral border-neutral-focus "
            placeholder={"e.g. What are edge functions?"}
          />

          {!loading && (
            <button
              className="px-4 font-medium btn btn-primary"
              onClick={(e) => generateAnswer(e)}
            >
              &rarr;
            </button>
          )}
          {loading && (
            <button className="px-4 font-medim btn btn-primary" disabled>
              <LoadingDots color="white" style="xl" />
            </button>
          )}
        </div>
      </main>
    </>
  );
};

export default ChatPage;
